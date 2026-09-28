package com.travelsphere.entity;

import com.travelsphere.entity.enums.RoleType;
import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false, unique = true)
    private RoleType name;

    @Column(length = 255)
    private String description;

    public Role() {}

    public Role(RoleType name, String description) {
        this.name = name;
        this.description = description;
    }

    public RoleType getName() {
        return name;
    }

    public void setName(RoleType name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
