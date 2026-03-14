package com.krishna.cp_tracker;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByTopic(String topic);
    List<Problem> findByStatus(String status);
    List<Problem> findByDifficulty(String difficulty);
    List<Problem> findByPlatform(String platform);
}