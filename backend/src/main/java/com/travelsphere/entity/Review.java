package com.travelsphere.entity;

import com.travelsphere.entity.enums.TargetType;
import jakarta.persistence.*;

@Entity
@Table(
    name = "reviews",
    uniqueConstraints = @UniqueConstraint(name = "uq_review_user_target", columnNames = {"user_id", "target_type", "target_id"})
)
public class Review extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", length = 30, nullable = false)
    private TargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "headline", length = 150)
    private String headline;

    @Column(name = "review_text", columnDefinition = "TEXT", nullable = false)
    private String reviewText;

    public Review() {}

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public TargetType getTargetType() {
        return targetType;
    }

    public void setTargetType(TargetType targetType) {
        this.targetType = targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public void setTargetId(Long targetId) {
        this.targetId = targetId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public String getReviewText() {
        return reviewText;
    }

    public void setReviewText(String reviewText) {
        this.reviewText = reviewText;
    }
}
