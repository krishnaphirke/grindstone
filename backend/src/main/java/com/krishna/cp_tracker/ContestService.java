package com.krishna.cp_tracker;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ContestService {

    private final ContestRepository repo;

    public ContestService(ContestRepository repo) {
        this.repo = repo;
    }

    public List<Contest> getAll() { return repo.findAllByOrderByDateDesc(); }
    public Contest add(Contest c) { return repo.save(c); }
    public void delete(Long id) { repo.deleteById(id); }
}