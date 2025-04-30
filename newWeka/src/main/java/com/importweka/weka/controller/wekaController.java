package com.importweka.weka.controller;

import com.importweka.weka.services.DTO.wekaDTO;
import com.importweka.weka.services.DTO.wekaResponseDTO;
import com.importweka.weka.services.wekaServices;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/prediccion")
public class wekaController {

    @Autowired
    private wekaServices service;

    @PostMapping("/predict")
    public List<wekaResponseDTO> predict(@RequestBody List<wekaDTO> inputs) throws Exception {
        return service.predict(inputs);
    }
}
