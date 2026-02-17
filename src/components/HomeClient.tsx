"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import CameraCapture from "@/components/CameraCapture";
import OcrProcessor from "@/components/OcrProcessor";
import DataPreview from "@/components/DataPreview";
import MetadataForm from "@/components/MetadataForm";
import SuccessScreen from "@/components/SuccessScreen";

type AppStep = "capture" | "ocr" | "preview" | "form" | "success";

interface ReceiptData {
  imageDataUrl: string;
  ocrText: string;
  receiptNumber: string;
  projectName: string;
  subject: string;
  amount: string;
  parsedFields: Record<string, string>;
  driveLink?: string;
  sheetLink?: string;
  storagePath?: string;
  resultMode?: string;
}

export default function HomeClient() {
  const [step, setStep] = useState<AppStep>("capture");
  const [receiptData, setReceiptData] = useState<ReceiptData>({
    imageDataUrl: "",
    ocrText: "",
    receiptNumber: "",
    projectName: "",
    subject: "",
    amount: "",
    parsedFields: {},
  });

  const handleImageCaptured = (imageDataUrl: string) => {
    setReceiptData((prev) => ({ ...prev, imageDataUrl }));
    setStep("ocr");
  };

  const handleOcrComplete = (text: string) => {
    setReceiptData((prev) => ({ ...prev, ocrText: text }));
    setStep("preview");
  };

  const handleOcrError = () => {
    setStep("capture");
  };

  const handlePreviewContinue = (editedFields: Record<string, string>) => {
    setReceiptData((prev) => ({
      ...prev,
      parsedFields: editedFields,
      receiptNumber: editedFields.receiptNumber || prev.receiptNumber,
      amount: editedFields.amount || prev.amount,
    }));
    setStep("form");
  };

  const handlePreviewRetake = () => {
    setReceiptData({
      imageDataUrl: "",
      ocrText: "",
      receiptNumber: "",
      projectName: "",
      subject: "",
      amount: "",
      parsedFields: {},
    });
    setStep("capture");
  };

  const handleFormSubmit = async (formData: {
    receiptNumber: string;
    projectName: string;
    subject: string;
    amount: string;
  }) => {
    const updatedData = { ...receiptData, ...formData };
    setReceiptData(updatedData);

    const payload = {
      imageDataUrl: updatedData.imageDataUrl,
      ocrText: updatedData.ocrText,
      receiptNumber: formData.receiptNumber,
      projectName: formData.projectName,
      subject: formData.subject,
      amount: formData.amount,
    };

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Upload failed");
      }

      const result = await response.json();
      setReceiptData((prev) => ({
        ...prev,
        driveLink: result.driveLink,
        sheetLink: result.sheetLink,
        storagePath: result.storagePath,
        resultMode: result.mode,
      }));
      setStep("success");
    } catch {
      throw new Error("Upload failed");
    }
  };

  const handleFormBack = () => {
    setStep("preview");
  };

  const handleScanAnother = () => {
    setReceiptData({
      imageDataUrl: "",
      ocrText: "",
      receiptNumber: "",
      projectName: "",
      subject: "",
      amount: "",
      parsedFields: {},
    });
    setStep("capture");
  };

  return (
    <div className="flex min-h-screen flex-col bg-warm-100">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        {step === "capture" && (
          <CameraCapture onImageCaptured={handleImageCaptured} />
        )}
        {step === "ocr" && (
          <OcrProcessor
            imageDataUrl={receiptData.imageDataUrl}
            onComplete={handleOcrComplete}
            onError={handleOcrError}
          />
        )}
        {step === "preview" && (
          <DataPreview
            imageDataUrl={receiptData.imageDataUrl}
            ocrText={receiptData.ocrText}
            onContinue={handlePreviewContinue}
            onRetake={handlePreviewRetake}
          />
        )}
        {step === "form" && (
          <MetadataForm
            ocrText={receiptData.ocrText}
            parsedFields={receiptData.parsedFields}
            onSubmit={handleFormSubmit}
            onBack={handleFormBack}
          />
        )}
        {step === "success" && (
          <SuccessScreen
            driveLink={receiptData.driveLink}
            sheetLink={receiptData.sheetLink}
            storagePath={receiptData.storagePath}
            resultMode={receiptData.resultMode}
            onScanAnother={handleScanAnother}
          />
        )}
      </main>
    </div>
  );
}
