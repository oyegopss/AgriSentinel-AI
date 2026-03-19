# AgriSentinel AI – Pipeline Verification

> Hackathon Demo: Notes for judges to understand how the CNN model was trained and converted into TFJS assets used in `app/disease-detection`.

## 1. Model training

```bash
.venv-datasets/bin/python scripts/train_model.py
```

- **Dataset:** PlantVillage (TensorFlow Datasets), 80% train / 20% val
- **Image size:** 224×224, batch 32, 10 epochs
- **Model:** MobileNetV2 (frozen) → GlobalAveragePooling → Dense(128, relu) → Dense(38, softmax)
- **Augmentation:** RandomFlip("horizontal"), RandomRotation(0.1), RandomZoom(0.1)
- **Outputs:** `model/plant_disease_model.h5`, `model/class_names.json`

## 2. Convert to TensorFlow.js

```bash
.venv-datasets/bin/python scripts/convert_to_tfjs.py
```

- **Input:** `model/plant_disease_model.h5`
- **Output:** `public/model/model.json`, `public/model/group1-shard*.bin`, `public/model/class_names.json`

## 3. Model files (frontend)

- `/model/model.json` – topology
- `/model/group1-shard*.bin` – weights
- `/model/class_names.json` – 38 class names (order = model output)

## 4. Frontend

- **Load:** `tf.loadLayersModel("/model/model.json")`
- **Logs:** "Loading TensorFlow model...", "TensorFlow model loaded successfully"
- **Errors:** Logged with `console.error` if load fails
- **Class names:** Fetched from `/model/class_names.json`; fallback to built-in list

## 5. Image preprocessing

- `tf.browser.fromPixels(image)` → `.resizeNearestNeighbor([224,224])` → `.toFloat()` → `.div(255)` → `.expandDims(0)`
- **Shape:** `[1, 224, 224, 3]`

## 6. Prediction

- `model.predict(tensor)` → `await prediction.data()`
- Probabilities sorted; top 3 shown with class names from `class_names.json` (or fallback)

## 7. Class labels

- Loaded from `public/model/class_names.json` (same order as model output)
- If 39 entries and last is `"raw"`, first 38 are used

## 8. Simplified UI mapping

- **healthy** → Healthy Leaf  
- **rust** → Rust Disease  
- **powdery / mildew / mold** → Powdery Mildew  
- **spot / blight / scab / rot** → Leaf Spot  

## 9. Confidence threshold

- If max probability &lt; 0.55 → **"Uncertain Leaf Condition"** and message to upload a clearer image

## 10. Performance

- **CNN inference time** (ms)
- **Grad-CAM heatmap time** (ms)
- **Total analysis time** (s)

## 11. Pipeline flow

Leaf image → Preprocess [1,224,224,3] → CNN → Probabilities → Top-3 + Grad-CAM → Disease label + recommendation

Errors are logged to the console for debugging.
