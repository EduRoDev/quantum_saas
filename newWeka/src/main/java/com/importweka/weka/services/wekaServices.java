package com.importweka.weka.services;

import com.importweka.weka.services.DTO.wekaDTO;
import com.importweka.weka.services.DTO.wekaResponseDTO;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import weka.classifiers.Classifier;
import weka.core.Attribute;
import weka.core.DenseInstance;
import weka.core.Instance;
import weka.core.Instances;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class wekaServices {

    private Classifier model;
    private Instances dataStructure;

    @PostConstruct
    public void init() throws Exception {
        // Cargar el modelo y la estructura ARFF
        InputStream modelStream = getClass().getClassLoader().getResourceAsStream("Modelo - copia.model");
        InputStream arffStream = getClass().getClassLoader().getResourceAsStream("Nuevo.csv - copia.arff");

        if (modelStream == null) {
            throw new Exception("El archivo 'Modelo - copia.model' no se pudo encontrar en el classpath.");
        }
        if (arffStream == null) {
            throw new Exception("El archivo 'Nuevo.csv - copia.arff' no se pudo encontrar en el classpath.");
        }

        model = (Classifier) weka.core.SerializationHelper.read(modelStream);
        dataStructure = new Instances(new java.io.BufferedReader(new java.io.InputStreamReader(arffStream)));
        dataStructure.setClassIndex(dataStructure.numAttributes() - 1);
    }

    public List<wekaResponseDTO> predict(List<wekaDTO> inputs) throws Exception {
        List<wekaResponseDTO> responses = new ArrayList<>();

        for (wekaDTO input : inputs) {
            Instance instance = new DenseInstance(dataStructure.numAttributes());
            instance.setDataset(dataStructure);

            // Asignar valores a los atributos del modelo
            instance.setValue(dataStructure.attribute("reservation_id"), input.getReservation_id());
            instance.setValue(dataStructure.attribute("client_id"), input.getClient_id());
            instance.setValue(dataStructure.attribute("hotel_id"), input.getHotel_id());
            instance.setValue(dataStructure.attribute("client_age_group"), input.getClient_age_group());
            instance.setValue(dataStructure.attribute("client_past_cancellations_strict"), input.getClient_past_cancellations_strict());
            instance.setValue(dataStructure.attribute("client_total_reservations_strict"), input.getClient_total_reservations_strict());
            instance.setValue(dataStructure.attribute("client_historical_cancel_rate_strict"), input.getClient_historical_cancel_rate_strict());
            instance.setValue(dataStructure.attribute("client_type"), input.getClient_type());
            instance.setValue(dataStructure.attribute("hotel_avg_room_price_for_profile"), input.getHotel_avg_room_price_for_profile());
            instance.setValue(dataStructure.attribute("client_spending_profile"), input.getClient_spending_profile());
            instance.setValue(dataStructure.attribute("hotel_canceled_strict"), input.getHotel_canceled_strict());
            instance.setValue(dataStructure.attribute("hotel_total_reservations_strict"), input.getHotel_total_reservations_strict());
            instance.setValue(dataStructure.attribute("hotel_cancellation_rate_strict"), input.getHotel_cancellation_rate_strict());
            instance.setValue(dataStructure.attribute("hotel_volume_category"), input.getHotel_volume_category());
            instance.setValue(dataStructure.attribute("room_price"), input.getRoom_price());
            instance.setValue(dataStructure.attribute("price_ratio_to_avg"), input.getPrice_ratio_to_avg());
            instance.setValue(dataStructure.attribute("stay_duration"), input.getStay_duration());
            instance.setValue(dataStructure.attribute("total_booking_value"), input.getTotal_booking_value());
            instance.setValue(dataStructure.attribute("booking_lead_time_category"), input.getBooking_lead_time_category());
            instance.setValue(dataStructure.attribute("booking_lead_time_days"), input.getBooking_lead_time_days());
            instance.setValue(dataStructure.attribute("is_peak_season"), input.getIs_peak_season());
            instance.setValue(dataStructure.attribute("concurrent_total"), input.getConcurrent_total());
            instance.setValue(dataStructure.attribute("concurrent_confirmed"), input.getConcurrent_confirmed());
            instance.setValue(dataStructure.attribute("concurrent_confirmation_rate"), input.getConcurrent_confirmation_rate());
            instance.setValue(dataStructure.attribute("same_day_checkins"), input.getSame_day_checkins());
            instance.setValue(dataStructure.attribute("concurrent_demand_level"), input.getConcurrent_demand_level());
            instance.setValue(dataStructure.attribute("payment_status_detail"), input.getPayment_status_detail());

            // Realizar la predicción
            double[] distribution = model.distributionForInstance(instance);
            Attribute classAttribute = dataStructure.classAttribute();

            Map<String, Double> probabilidades = new LinkedHashMap<>();
            String clasePredicha = "";
            double maxProb = -1;

            for (int i = 0; i < distribution.length; i++) {
                String className = classAttribute.value(i);
                String classNameMapped = className.equals("1") ? "cancelada" : "no cancelada";
                double porcentaje = Math.round(distribution[i] * 10000.0) / 100.0;
                probabilidades.put(classNameMapped, porcentaje);

                if (distribution[i] > maxProb) {
                    maxProb = distribution[i];
                    clasePredicha = classNameMapped;
                }
            }

            // Agregar la respuesta con el client_id
            responses.add(new wekaResponseDTO(input.getReservation_id(), input.getClient_id(), clasePredicha, probabilidades));
        }

        return responses;
    }
}
