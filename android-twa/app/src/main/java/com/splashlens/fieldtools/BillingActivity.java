package com.splashlens.fieldtools;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryPurchasesParams;
import com.android.billingclient.api.QueryProductDetailsParams;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

public class BillingActivity extends Activity implements PurchasesUpdatedListener {
    private BillingClient billingClient;
    private String action = "purchase";
    private String productId = "partsnap_pro_monthly";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Uri data = getIntent().getData();
        if (data != null && data.getQueryParameter("action") != null) {
            action = data.getQueryParameter("action");
        }
        if (data != null && data.getQueryParameter("productId") != null) {
            productId = data.getQueryParameter("productId");
        }
        if (!"partsnap_pro_monthly".equals(productId) && !"partsnap_pro_annual".equals(productId)) {
            showAndFinish("That SplashLens product is not configured yet.");
            return;
        }
        connectBilling();
    }

    private void connectBilling() {
        billingClient = BillingClient.newBuilder(this)
                .setListener(this)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .enableAutoServiceReconnection()
                .build();
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    if ("restore".equals(action)) {
                        restorePurchases();
                    } else {
                        queryProduct();
                    }
                } else {
                    showAndFinish("Google Play billing is not ready yet.");
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                showAndFinish("Google Play billing disconnected. Please try again.");
            }
        });
    }

    private void queryProduct() {
        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build();
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(product))
                .build();
        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsResult) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK ||
                    productDetailsResult == null ||
                    productDetailsResult.getProductDetailsList().isEmpty()) {
                runOnUiThread(() -> showAndFinish("PartSnap Pro is not live in Google Play yet."));
                return;
            }
            ProductDetails details = productDetailsResult.getProductDetailsList().get(0);
            String offerToken = firstOfferToken(details);
            if (offerToken == null) {
                runOnUiThread(() -> showAndFinish("Google Play subscription offer is missing."));
                return;
            }
            BillingFlowParams.ProductDetailsParams detailsParams =
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(details)
                            .setOfferToken(offerToken)
                            .build();
            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(detailsParams))
                    .build();
            billingClient.launchBillingFlow(this, flowParams);
        });
    }

    private String firstOfferToken(ProductDetails details) {
        List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
        if (offers == null || offers.isEmpty()) return null;
        return offers.get(0).getOfferToken();
    }

    private void restorePurchases() {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build();
        billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null || purchases.isEmpty()) {
                runOnUiThread(() -> showAndFinish("No active PartSnap Pro subscription was found."));
                return;
            }
            for (Purchase purchase : purchases) {
                List<String> products = purchase.getProducts();
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED &&
                        products != null &&
                        (products.contains("partsnap_pro_monthly") || products.contains("partsnap_pro_annual"))) {
                    productId = products.contains("partsnap_pro_annual") ? "partsnap_pro_annual" : "partsnap_pro_monthly";
                    verifyAndActivate(purchase);
                    return;
                }
            }
            runOnUiThread(() -> showAndFinish("No active PartSnap Pro subscription was found."));
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            showAndFinish("Purchase cancelled.");
            return;
        }
        if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null) {
            showAndFinish("Google Play could not complete that purchase.");
            return;
        }
        for (Purchase purchase : purchases) {
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                verifyAndActivate(purchase);
                return;
            }
        }
        showAndFinish("Purchase is pending. Access will unlock after Google confirms payment.");
    }

    private void verifyAndActivate(Purchase purchase) {
        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("store", "android");
                body.put("productId", productId);
                body.put("purchaseToken", purchase.getPurchaseToken());
                body.put("transactionId", purchase.getOrderId());

                HttpURLConnection connection = (HttpURLConnection) new URL("https://app.splashlens.com/api/native-entitlement").openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
                try (OutputStream output = connection.getOutputStream()) {
                    output.write(body.toString().getBytes(StandardCharsets.UTF_8));
                }
                int status = connection.getResponseCode();
                if (status != 200) {
                    runOnUiThread(() -> showAndFinish("Purchase received, but SplashLens could not activate it yet."));
                    return;
                }
                String response = new java.util.Scanner(connection.getInputStream(), StandardCharsets.UTF_8.name()).useDelimiter("\\A").next();
                JSONObject payload = new JSONObject(response);
                String activateUrl = payload.optString("activateUrl", "");
                if (!activateUrl.startsWith("https://app.splashlens.com/")) {
                    runOnUiThread(() -> showAndFinish("SplashLens returned an invalid activation link."));
                    return;
                }
                if (!purchase.isAcknowledged()) {
                    AcknowledgePurchaseParams ack = AcknowledgePurchaseParams.newBuilder()
                            .setPurchaseToken(purchase.getPurchaseToken())
                            .build();
                    billingClient.acknowledgePurchase(ack, result -> {});
                }
                runOnUiThread(() -> {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(activateUrl)));
                    finish();
                });
            } catch (Exception e) {
                runOnUiThread(() -> showAndFinish("SplashLens could not reach the entitlement server."));
            }
        }).start();
    }

    private void showAndFinish(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        finish();
    }
}
