package com.krishna.cp_tracker;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ContestRepository extends JpaRepository<Contest, Long> {
    List<Contest> findAllByOrderByDateDesc();
}