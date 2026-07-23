package com.tradepro.dto;

public class PaymentVerificationRequest {
    private Long tradeId;
    private String paymentReference;

    public PaymentVerificationRequest() {}

    public PaymentVerificationRequest(Long tradeId, String paymentReference) {
        this.tradeId = tradeId;
        this.paymentReference = paymentReference;
    }

    public Long getTradeId() { return tradeId; }
    public void setTradeId(Long tradeId) { this.tradeId = tradeId; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
}
