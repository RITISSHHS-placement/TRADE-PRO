package com.tradepro.repository;

import com.tradepro.entity.BoundDevice;
import com.tradepro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoundDeviceRepository extends JpaRepository<BoundDevice, Long> {
    Optional<BoundDevice> findByUserAndDeviceId(User user, String deviceId);
    List<BoundDevice> findByUser(User user);
    List<BoundDevice> findByUserAndTrusted(User user, Boolean trusted);
}
