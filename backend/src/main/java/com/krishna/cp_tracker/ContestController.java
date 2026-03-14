package com.krishna.cp_tracker;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;

@RestController
@RequestMapping("/api/contests")
@CrossOrigin(origins = "http://localhost:5173")
public class ContestController {

    private final ContestService service;

    public ContestController(ContestService service) {
        this.service = service;
    }

    @GetMapping
    public List<Contest> getAll() { return service.getAll(); }

    @PostMapping
    public Contest add(@RequestBody Contest c) { return service.add(c); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}