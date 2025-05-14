const { faker } = require('@faker-js/faker');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');

const countriesData = {
    'Colombia': { code: '+57', cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Santa Marta'] },
};

const getRandomCity = (country) => faker.helpers.arrayElement(countriesData[country].cities);
const generateStandardPhoneNumber = (country) => {
    const code = countriesData[country].code;
    const localNumber = faker.string.numeric(10);
    return `${code} ${localNumber.substring(0, 3)}-${localNumber.substring(3, 6)}-${localNumber.substring(6)}`;
};

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "quantum_saas",
    password: "123456",
    port: 5432,
});

async function insertData() {
    try {
        fs.writeFileSync('passwords.txt', '');

        await pool.query('TRUNCATE TABLE "payment_reservation", "reservation", "room", "admin_hotels", "hotel", "payment_services", "client", "user" CASCADE');

        const clientIds = [], roomIds = [], reservationIds = [];

        // Configurar una semilla fija para generar datos consistentes
        faker.seed(12345);

        // Crear usuario admin del hotel
        const adminName = "Carlos";
        const adminLastName = "Gómez";
        const adminEmail = "carlos.gomez@hotel.com";
        const adminPassword = "Admin1234";
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const country = 'Colombia';
        const city = "Bogotá";

        fs.appendFileSync('passwords.txt', `Admin | Email: ${adminEmail} | Contraseña: ${adminPassword}\n`);

        const userRes = await pool.query(`
            INSERT INTO "user" (name, last_name, email, password, rol, type_document, number_document, phone, country, city, has_premium_service, has_vip_service)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [
                adminName,
                adminLastName,
                adminEmail,
                hashedPassword,
                'admin',
                'CC',
                '1234567890',
                '+57 300-123-4567',
                country,
                city,
                true,
                true
            ]
        );
        const adminUserId = userRes.rows[0].id;

        // Crear un hotel
        const hotelRes = await pool.query(`
            INSERT INTO "hotel" (name, description, type_accomodation, country, city, address, phone, email)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
            [
                "Hotel Real",
                "Un hotel de lujo ubicado en el corazón de Bogotá.",
                'hotel',
                country,
                city,
                "Calle 123 #45-67",
                '+57 300-987-6543',
                'contacto@hotelreal.com'
            ]);
        const hotelId = hotelRes.rows[0].id;

        // Asociar admin al hotel
        await pool.query(`INSERT INTO "admin_hotels" (user_id, hotel_id) VALUES ($1, $2)`, [adminUserId, hotelId]);

        // Crear clientes
        for (let i = 0; i < 1000; i++) {
            const name = `Cliente${i + 1}`;
            const lastName = `Apellido${i + 1}`;
            const email = `cliente${i + 1}@correo.com`;
            const password = `Password${i + 1}`;
            const hashedPassword = await bcrypt.hash(password, 10);

            fs.appendFileSync('passwords.txt', `Cliente | Email: ${email} | Contraseña: ${password}\n`);

            const res = await pool.query(`
                INSERT INTO "client" (name, last_name, email, phone, password, rol, country, type_document, number_document, birth_date)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
                [
                    name,
                    lastName,
                    email,
                    '+57 300-123-4567',
                    hashedPassword,
                    'user',
                    country,
                    'CC',
                    `12345678${i}`,
                    '1990-01-01'
                ]
            );
            clientIds.push(res.rows[0].id);
        }

        // Crear habitaciones para el único hotel
        for (let i = 0; i < 25; i++) {
            const res = await pool.query(`
                INSERT INTO "room" (name, description, price, status, ability, image, hotel_id)
                VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
                [
                    `Habitación ${i + 1}`,
                    `Habitación cómoda y equipada con todas las comodidades necesarias.`,
                     150000 + i * 10000, // Precios en pesos colombianos
                    'free',
                    '2',
                    'https://via.placeholder.com/150',
                    hotelId
                ]);
            roomIds.push(res.rows[0].id);
        }

        // Crear reservas realistas (fechas coherentes)
        for (let i = 0; i < 10000; i++) {
            const roomId = faker.helpers.arrayElement(roomIds);
            const clientId = faker.helpers.arrayElement(clientIds);

            const createdAt = faker.date.past({ years: 1 });
            const checkIn = faker.date.future({ days: 180 });
            const checkOut = faker.date.soon({ days: faker.number.int({ min: 1, max: 14 }), refDate: checkIn });
            const updatedAt = faker.date.between({ from: createdAt, to: checkOut });

            // Verificar disponibilidad de la habitación
            const availabilityCheck = await pool.query(`
                SELECT COUNT(*) AS count
                FROM "reservation"
                WHERE room_id = $1 AND (
                    ($2 < check_out AND $3 > check_in)
                )`, [roomId, checkIn, checkOut]);

            if (parseInt(availabilityCheck.rows[0].count) === 0) {
                // Insertar reserva si no hay conflictos
                const res = await pool.query(`
                    INSERT INTO "reservation" (room_id, client_id, status, check_in, check_out, created_at, updated_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
                    [
                        roomId,
                        clientId,
                        faker.helpers.arrayElement(['confirmed', 'canceled', 'refunded']),
                        checkIn,
                        checkOut,
                        createdAt,
                        updatedAt
                    ]);
                reservationIds.push({ id: res.rows[0].id, clientId, roomId, createdAt, updatedAt });

                // Actualizar el estado de la habitación a 'booked'
                await pool.query(`
                    UPDATE "room"
                    SET status = 'booked'
                    WHERE id = $1`, [roomId]);
            } else {
                console.log(`❌ Conflicto de reserva para la habitación ${roomId} entre ${checkIn} y ${checkOut}`);
            }
        }

        // Crear pagos para reservas
        for (const reservation of reservationIds) {
            const paymentStatus = faker.helpers.arrayElement(['pending', 'confirmed', 'canceled', 'refunded']);
            await pool.query(`
                INSERT INTO "payment_reservation" (payment_date, status, amount, payment_method, reservation_id, client_id, room_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    reservation.updatedAt,
                    paymentStatus,
                    faker.number.int({ min: 80000, max: 500000 }), // Precios en pesos colombianos
                    faker.helpers.arrayElement(['visa', 'mastercard', 'paypal', 'other']),
                    reservation.id,
                    reservation.clientId,
                    reservation.roomId,
                    reservation.createdAt,
                    reservation.updatedAt
                ]);

            // Si el pago está confirmado, actualizar el estado de la habitación a 'busy'
            if (paymentStatus === 'confirmed') {
                await pool.query(`
                    UPDATE "room"
                    SET status = 'busy'
                    WHERE id = $1`, [reservation.roomId]);
            }
        }

        // Crear pago de servicio premium/VIP para el usuario admin
        const type = faker.helpers.arrayElement(['PREMIUN', 'VIP']);
        const description = type === 'PREMIUN' ? 'Acceso completo al servicio durante un mes' : 'Acceso exclusivo con beneficios adicionales';
        const price = type === 'PREMIUN' ? 29900 : 49900; // Precios en pesos colombianos
        const createdAt = faker.date.past({ years: 1 });
        const updatedAt = faker.date.between({ from: createdAt, to: new Date() });

        await pool.query(`
            INSERT INTO "payment_services" (name, description, price, active, created_at, updated_at, "userId")
            VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [type, description, price, true, createdAt, updatedAt, adminUserId]);

        console.log('✅ Datos generados correctamente');
    } catch (error) {
        console.error('❌ Error generando datos:', error);
    }
}

insertData();
