package com.importweka.weka.services.DTO;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class wekaResponseDTO {
    private int reservaId;
    private int clientId;
    private String prediction;
    private Map<String, Double> probabilities;
}
