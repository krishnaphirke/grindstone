package com.krishna.cp_tracker;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProblemService {

    private final ProblemRepository repo;

    public ProblemService(ProblemRepository repo) {
        this.repo = repo;
    }

    public List<Problem> getAll() { return repo.findAll(); }
    public Problem add(Problem p) { return repo.save(p); }
    public void delete(Long id) { repo.deleteById(id); }
    public List<Problem> getByTopic(String topic) { return repo.findByTopic(topic); }
    public List<Problem> getByStatus(String status) { return repo.findByStatus(status); }
    public List<Problem> getByDifficulty(String d) { return repo.findByDifficulty(d); }

    public Problem updateStatus(Long id, String status) {
        Problem p = repo.findById(id).orElseThrow();
        p.setStatus(status);
        if (status.equals("To Revisit")) {
            p.setNextReviewDate(java.time.LocalDate.now().plusDays(0));
            p.setReviewInterval(1);
            p.setReviewCount(0);
        }
        return repo.save(p);
    }

    public Map<String, Long> countByTopic() {
        return repo.findAll().stream()
                .collect(Collectors.groupingBy(Problem::getTopic, Collectors.counting()));
    }

    public Map<String, Long> countByDifficulty() {
        return repo.findAll().stream()
                .collect(Collectors.groupingBy(Problem::getDifficulty, Collectors.counting()));
    }
    public Map<String, Long> countByDate() {
        return repo.findAll().stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().toLocalDate().toString(),
                        Collectors.counting()
                ));
    }
    public List<Problem> getDueToday() {
        java.time.LocalDate today = java.time.LocalDate.now();
        return repo.findAll().stream()
                .filter(p -> p.getNextReviewDate() != null && !p.getNextReviewDate().isAfter(today))
                .collect(Collectors.toList());
    }

    public Problem markReviewed(Long id) {
        Problem p = repo.findById(id).orElseThrow();
        int[] intervals = {1, 3, 7, 14};
        int count = p.getReviewCount() == null ? 0 : p.getReviewCount();
        int nextInterval = intervals[Math.min(count, intervals.length - 1)];
        p.setReviewCount(count + 1);
        p.setReviewInterval(nextInterval);
        p.setNextReviewDate(java.time.LocalDate.now().plusDays(nextInterval));
        return repo.save(p);
    }
}