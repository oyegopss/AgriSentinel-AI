#!/usr/bin/env python3
"""
Hackathon Demo: Train the disease classifier model used by the frontend inference.

Train a MobileNetV2 CNN on PlantVillage (38 classes) for AgriSentinel AI.

Architecture:
    MobileNetV2 (ImageNet, frozen) → GlobalAveragePooling → Dense(128, relu) → Dense(38, softmax)

Dataset:
    PlantVillage – ~54,306 RGB images, 38 classes, 14 crops.
    Loaded from Hugging Face (mohanty/PlantVillage) OR from local dir
    datasets/plantvillage/color_by_class/ if it contains images.

Data augmentation:
    RandomFlip("horizontal"), RandomRotation(0.1), RandomZoom(0.1)

Output:
    model/plant_disease_model.h5

Usage (from project root):
    .venv-datasets/bin/pip install tensorflow
    .venv-datasets/bin/python scripts/train_model.py
"""

import os
import sys
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = PROJECT_ROOT / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODEL_DIR / "plant_disease_model.h5"
CLASS_NAMES_PATH = MODEL_DIR / "class_names.json"
LOCAL_DATASET_DIR = PROJECT_ROOT / "datasets" / "plantvillage" / "color_by_class"

os.environ["HF_HOME"] = str(PROJECT_ROOT / ".cache" / "huggingface")
os.environ["HF_DATASETS_CACHE"] = str(PROJECT_ROOT / ".cache" / "huggingface" / "datasets")

IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 10
NUM_CLASSES = 38
VAL_SPLIT = 0.2


def local_dataset_has_images() -> bool:
    """Check if local dataset dir has actual images in class subfolders."""
    if not LOCAL_DATASET_DIR.exists():
        return False
    for class_dir in LOCAL_DATASET_DIR.iterdir():
        if not class_dir.is_dir():
            continue
        for f in class_dir.iterdir():
            if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png"):
                return True
    return False


def train_from_local():
    """Train using tf.keras.utils.image_dataset_from_directory."""
    import tensorflow as tf

    print(f"Loading dataset from {LOCAL_DATASET_DIR}")
    train_ds = tf.keras.utils.image_dataset_from_directory(
        str(LOCAL_DATASET_DIR),
        validation_split=VAL_SPLIT,
        subset="training",
        seed=42,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        label_mode="int",
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        str(LOCAL_DATASET_DIR),
        validation_split=VAL_SPLIT,
        subset="validation",
        seed=42,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        label_mode="int",
    )
    class_names = train_ds.class_names
    print(f"Classes ({len(class_names)}): {class_names[:5]}...")

    with open(CLASS_NAMES_PATH, "w") as f:
        json.dump(class_names, f, indent=2)

    train_ds = train_ds.map(lambda x, y: (x / 255.0, y))
    val_ds = val_ds.map(lambda x, y: (x / 255.0, y))
    train_ds = train_ds.prefetch(tf.data.AUTOTUNE)
    val_ds = val_ds.prefetch(tf.data.AUTOTUNE)

    return train_ds, val_ds, class_names


def train_from_tfds():
    """Train using TensorFlow Datasets (plant_village has 38 classes and real images)."""
    import tensorflow as tf
    import tensorflow_datasets as tfds

    print("Loading PlantVillage from TensorFlow Datasets...")
    ds_builder = tfds.builder("plant_village")
    ds_builder.download_and_prepare()
    info = ds_builder.info
    class_names = info.features["label"].names
    assert len(class_names) == NUM_CLASSES, f"Expected {NUM_CLASSES} classes, got {len(class_names)}"
    print(f"Classes ({len(class_names)}): {class_names[:5]}...")

    with open(CLASS_NAMES_PATH, "w") as f:
        json.dump(class_names, f, indent=2)

    # TFDS plant_village only has "train" split; take 80% train, 20% validation
    n = info.splits["train"].num_examples
    n_val = int(n * VAL_SPLIT)
    n_train = n - n_val
    full_ds = ds_builder.as_dataset(split="train", as_supervised=True)

    def preprocess(img, label):
        img = tf.cast(img, tf.float32) / 255.0
        img = tf.image.resize(img, [IMG_SIZE, IMG_SIZE])
        return img, label

    full_ds = full_ds.map(preprocess, num_parallel_calls=tf.data.AUTOTUNE).shuffle(10000)
    train_ds = full_ds.skip(n_val).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    val_ds = full_ds.take(n_val).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    return train_ds, val_ds, class_names


def train_from_huggingface():
    """Train using Hugging Face datasets (downloads automatically)."""
    import tensorflow as tf
    import numpy as np

    print("Loading PlantVillage from Hugging Face...")
    from datasets import load_dataset

    try:
        dataset = load_dataset("mohanty/PlantVillage", "default")
    except Exception:
        dataset = load_dataset("thrillchad/PlantVillage", "color")

    train_split = dataset["train"]
    test_split = dataset["test"]

    features = train_split.features
    keys = list(train_split[0].keys())
    image_key = "image" if "image" in keys else "img"
    label_key = None
    for k in ("label", "disease", "disease_name", "class_name"):
        if k in keys:
            label_key = k
            break
    if label_key is None:
        label_key = next((k for k in keys if k != image_key), keys[0])

    # PlantVillage on HF may use path-like labels (e.g. "raw/color/Apple___Apple_scab/xxx.JPG")
    # Extract 38 class names from paths: segment after "raw/color/" or "color/" up to next "/"
    def path_to_class(s):
        s = str(s).strip()
        for prefix in ("raw/color/", "color/"):
            if s.startswith(prefix):
                rest = s[len(prefix) :]
                if "/" in rest:
                    return rest.split("/", 1)[0]
                return rest
        if "/" in s:
            return s.split("/", 1)[0]
        return s

    id2label = None
    if label_key in features and hasattr(features[label_key], "names"):
        names = features[label_key].names
        if names and len(names) == NUM_CLASSES and not any("/" in str(n) for n in names[:3]):
            id2label = names
            class_names = list(id2label)
        else:
            unique_classes = sorted(set(path_to_class(row[label_key]) for row in train_split))
            class_names = unique_classes
            label2id = {name: i for i, name in enumerate(class_names)}
            id2label = None
    else:
        unique_classes = sorted(set(path_to_class(row[label_key]) for row in train_split))
        class_names = unique_classes
        label2id = {name: i for i, name in enumerate(class_names)}
        id2label = None

    if len(class_names) not in (38, 39):
        raise AssertionError(
            f"Expected 38 or 39 PlantVillage classes, got {len(class_names)}. "
            f"First few: {class_names[:8]}. Check dataset format."
        )
    print(f"Classes ({len(class_names)}): {class_names[:5]}...")
    with open(CLASS_NAMES_PATH, "w") as f:
        json.dump(class_names, f, indent=2)

    def to_numpy(split):
        images = []
        labels = []
        for i, row in enumerate(split):
            img = row.get(image_key)
            if img is None:
                continue
            img = img.convert("RGB").resize((IMG_SIZE, IMG_SIZE))
            images.append(np.array(img, dtype=np.float32) / 255.0)
            raw_label = row[label_key]
            if isinstance(raw_label, int):
                labels.append(raw_label)
            else:
                class_name = path_to_class(raw_label)
                labels.append(label2id[class_name])
            if (i + 1) % 10000 == 0:
                print(f"  Processed {i + 1}/{len(split)}")
        return np.array(images), np.array(labels, dtype=np.int32)

    print("Processing train split...")
    X_train, y_train = to_numpy(train_split)
    print(f"  Train: {X_train.shape}, labels: {y_train.shape}")
    print("Processing test/val split...")
    X_val, y_val = to_numpy(test_split)
    print(f"  Val: {X_val.shape}, labels: {y_val.shape}")

    train_ds = tf.data.Dataset.from_tensor_slices((X_train, y_train)).shuffle(10000).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    val_ds = tf.data.Dataset.from_tensor_slices((X_val, y_val)).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

    return train_ds, val_ds, class_names


def build_model(num_classes: int):
    import tensorflow as tf

    # Data augmentation layers
    data_augmentation = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal"),
        tf.keras.layers.RandomRotation(0.1),
        tf.keras.layers.RandomZoom(0.1),
    ])

    # MobileNetV2 base (frozen)
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False

    # Architecture: MobileNetV2 → GAP → Dense(128, relu) → Dense(38, softmax)
    model = tf.keras.Sequential([
        tf.keras.layers.InputLayer(input_shape=(IMG_SIZE, IMG_SIZE, 3)),
        data_augmentation,
        base_model,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()
    return model


def main():
    import tensorflow as tf
    print(f"TensorFlow version: {tf.__version__}")
    print(f"GPU available: {len(tf.config.list_physical_devices('GPU')) > 0}")

    if local_dataset_has_images():
        print("Using local dataset at", LOCAL_DATASET_DIR)
        train_ds, val_ds, class_names = train_from_local()
    else:
        print("Local dataset empty. Using TensorFlow Datasets (downloads ~800MB)...")
        train_ds, val_ds, class_names = train_from_tfds()

    num_classes = len(class_names)
    assert num_classes in (38, 39), f"Expected 38 or 39 classes, got {num_classes}"
    model = build_model(num_classes)

    print(f"\nTraining for {EPOCHS} epochs...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
    )

    final_acc = history.history["accuracy"][-1]
    final_val_acc = history.history["val_accuracy"][-1]
    print(f"\nFinal train accuracy: {final_acc:.4f}")
    print(f"Final val accuracy:   {final_val_acc:.4f}")

    model.save(str(MODEL_PATH))
    print(f"\nModel saved to {MODEL_PATH}")
    print(f"Class names saved to {CLASS_NAMES_PATH}")
    print("\nNext step: convert to TF.js with:")
    print(f"  .venv-datasets/bin/python scripts/convert_to_tfjs.py")


if __name__ == "__main__":
    main()
