package com.krishna.cp_tracker;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "contests")
public class Contest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String platform;
    private LocalDate date;
    private Integer rank;
    private Integer problemsSolved;
    private Integer ratingChange;
    private String notes;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public Integer getProblemsSolved() { return problemsSolved; }
    public void setProblemsSolved(Integer problemsSolved) { this.problemsSolved = problemsSolved; }

    public Integer getRatingChange() { return ratingChange; }
    public void setRatingChange(Integer ratingChange) { this.ratingChange = ratingChange; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}