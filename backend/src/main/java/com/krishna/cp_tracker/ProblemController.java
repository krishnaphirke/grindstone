package com.krishna.cp_tracker;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.*;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:5173")
public class ProblemController {

    private final ProblemService service;

    public ProblemController(ProblemService service) {
        this.service = service;
    }

    @GetMapping
    public List<Problem> getAll() { return service.getAll(); }

    @PostMapping
    public Problem add(@RequestBody Problem p) { return service.add(p); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public Problem updateStatus(@PathVariable Long id, @RequestParam String status) {
        return service.updateStatus(id, status);
    }

    @GetMapping("/filter")
    public List<Problem> filter(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String difficulty
    ) {
        if (topic != null) return service.getByTopic(topic);
        if (status != null) return service.getByStatus(status);
        if (difficulty != null) return service.getByDifficulty(difficulty);
        return service.getAll();
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        Map<String, Object> data = new HashMap<>();
        data.put("byTopic", service.countByTopic());
        data.put("byDifficulty", service.countByDifficulty());
        data.put("total", service.getAll().size());
        return data;
    }
    @GetMapping("/heatmap")
    public Map<String, Long> heatmap() {
        return service.countByDate();
    }
    @GetMapping("/due-today")
    public List<Problem> dueToday() {
        return service.getDueToday();
    }

    @PatchMapping("/{id}/reviewed")
    public Problem markReviewed(@PathVariable Long id) {
        return service.markReviewed(id);
    }
}