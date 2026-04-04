from huggingface_hub import snapshot_download
import os

repo_id = "enalis/LeafNet"
local_dir = "./datasets/leafnet"

print(f"🚀 Starting download of {repo_id} to {local_dir}...")
print("⚠️ Note: This dataset is large (186k images). This may take a while.")

try:
    os.makedirs(local_dir, exist_ok=True)
    snapshot_download(
        repo_id=repo_id,
        repo_type="dataset",
        local_dir=local_dir,
        token=os.getenv("HF_TOKEN"),
        local_dir_use_symlinks=False
    )
    print(f"✅ Download complete! Dataset located at: {os.path.abspath(local_dir)}")
except Exception as e:
    print(f"❌ Error during download: {e}")
