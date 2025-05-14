package com.importweka.weka.services.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class wekaDTO {
    private int reservation_id; // Identificador único de la reserva
    private int client_id; // Identificador único del cliente
    private int hotel_id; // Identificador único del hotel
    private int client_age_group;
    private int client_past_cancellations_strict;
    private int client_total_reservations_strict;
    private double client_historical_cancel_rate_strict;
    private String client_type; // {occasional, new, regular}
    private double hotel_avg_room_price_for_profile;
    private String client_spending_profile; // {avg_spender, below_avg_spender, new_client, above_avg_spender}
    private int hotel_canceled_strict;
    private int hotel_total_reservations_strict;
    private double hotel_cancellation_rate_strict;
    private String hotel_volume_category; // {high_volume}
    private double room_price;
    private double price_ratio_to_avg;
    private int stay_duration;
    private double total_booking_value;
    private String booking_lead_time_category; // {lead_30_plus_days, lead_7_29_days, lead_3_6_days}
    private int booking_lead_time_days;
    private int is_peak_season;
    private int concurrent_total;
    private int concurrent_confirmed;
    private double concurrent_confirmation_rate;
    private int same_day_checkins;
    private String concurrent_demand_level; // {demand_high}
    private String payment_status_detail; // {P_Paid_LessThan50Pct, P_Paid_50To99Pct, P_Paid_FullOrMore}
}
