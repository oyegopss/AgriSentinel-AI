# CNN Crop Disease Classifier

> Hackathon Demo: this folder documents the TensorFlow.js model assets used by the disease detection pipeline.

This folder contains a TensorFlow.js model used by the **Disease Detection** page.

## Current model: Leaf Doctor (PlantVillage)

- **Source:** [Leaf Doctor](https://github.com/priyaramesh26/leafdoctor) — MobileNet-based classifier trained on the PlantVillage dataset.
- **Input:** Image tensor shape `[1, 224, 224, 3]`, pixel values normalized 0–1.
- **Output:** 38 class probabilities (PlantVillage species/disease labels). The app maps these to 4 categories:
  - **Healthy Leaf**
  - **Leaf Spot**
  - **Rust Disease**
  - **Powdery Mildew**

## Files

- `model.json` — Model topology and weight manifest.
- `group1-shard1of4.bin` … `group1-shard4of4.bin` — Weight shards.

## Replacing the model

To use a different model (e.g. a 4-class CNN):

1. Ensure input shape is `[batch, 224, 224, 3]` and values are in [0, 1].
2. Either:
   - **4-class model:** Output 4 probabilities in order: Healthy Leaf, Leaf Spot, Rust Disease, Powdery Mildew.
   - **Or** keep the 38-class PlantVillage format; the app will map them to the 4 labels above.

Place `model.json` and any `.bin` weight files here. The app loads from `/model/model.json`.
