"""Write the RobustVideoMatting alpha matte of a video as a PNG sequence, one file per frame.

usage: rvm-alpha.py <rvm_repo> <weights.pth> <variant> <input.mp4> <out_alpha_png_dir> [downsample]

<variant> is resnet50 (cleaner edges) or mobilenetv3 (faster). RobustVideoMatting itself is
GPL-3.0 and is downloaded separately, see skill/freistellung.md.
"""
import sys

repo, weights, variant, src, out = sys.argv[1:6]
downsample = float(sys.argv[6]) if len(sys.argv) > 6 else 0.25
sys.path.insert(0, repo)

import torch  # noqa: E402
from model import MattingNetwork  # noqa: E402
from inference import convert_video  # noqa: E402

if torch.cuda.is_available():
    device = "cuda"
elif torch.backends.mps.is_available():
    device = "mps"
else:
    device = "cpu"

model = MattingNetwork(variant).eval().to(device)
model.load_state_dict(torch.load(weights, map_location=device))
convert_video(
    model,
    input_source=src,
    downsample_ratio=downsample,
    output_type="png_sequence",
    output_alpha=out,
    seq_chunk=8,
    device=device,
    progress=True,
)
