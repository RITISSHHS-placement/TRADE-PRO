package com.tradepro.repository;

import com.tradepro.entity.RefreshToken;
import com.tradepro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    Optional<RefreshToken> findByTokenId(String tokenId);
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    void deleteByUser(User user);
}
