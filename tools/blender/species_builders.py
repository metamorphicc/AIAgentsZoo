"""Species-specific geometry and natural behaviour clips for AI Agent Zoo."""

import math

from zoo_model_utils import (
    attach,
    cone,
    create_action,
    create_rig,
    cube,
    cylinder,
    cylinder_between,
    feather_row,
    ico,
    material,
    reset_scene,
    save_and_export,
    set_preview_scene,
    wedge,
)


R = math.radians


def build_owl():
    reset_scene()
    brown = material("Feathers / burnt umber", (0.28, 0.075, 0.028), roughness=0.86)
    rust = material("Feathers / zoo orange", (0.78, 0.22, 0.045), roughness=0.8)
    rust_light = material("Feathers / copper edge", (0.98, 0.42, 0.08), roughness=0.76)
    cream = material("Face / warm cream", (1.0, 0.78, 0.43), roughness=0.72)
    chest = material("Chest / pale down", (0.88, 0.70, 0.38), roughness=0.86)
    ink = material("Eyes / midnight", (0.006, 0.009, 0.007), roughness=0.28)
    lime = material("Eyes / agent signal", (0.66, 1.0, 0.08), metallic=0.1, roughness=0.24)
    orange = material("Beak and talons", (1.0, 0.38, 0.018), roughness=0.54)

    rig = create_rig("Owl", [
        ("root", (0, 0, 0), (0, 0, 0.6), None),
        ("body", (0, 0, 0.6), (0, 0, 2.55), "root"),
        ("head", (0, 0, 2.5), (0, 0, 3.55), "body"),
        ("wing.L", (0.45, 0, 2.3), (1.25, 0, 1.45), "body"),
        ("wing.R", (-0.45, 0, 2.3), (-1.25, 0, 1.45), "body"),
        ("lid.L", (0.43, -0.82, 3.1), (0.43, -0.82, 3.34), "head"),
        ("lid.R", (-0.43, -0.82, 3.1), (-0.43, -0.82, 3.34), "head"),
    ])

    body = [
        ico("Owl_Body", (0, 0, 1.55), (1.02, 0.74, 1.32), brown),
        ico("Owl_Chest", (0, -0.62, 1.55), (0.66, 0.17, 0.82), chest),
    ]
    feather_row("Chest_Feather", (0, -0.79, 1.36), 5, 0.22, (0.11, 0.045, 0.19), cream, body)
    feather_row("Tail_Feather", (0, 0.18, 0.56), 5, 0.18, (0.14, 0.25, 0.5), rust_light, body)
    for side in (-1, 1):
        body.append(cylinder(f"Leg_{side}", (0.36 * side, 0, 0.38), 0.08, 0.48, orange, vertices=7))
        for toe in (-0.12, 0, 0.12):
            body.append(cylinder(f"Toe_{side}_{toe}", (0.36 * side + toe, -0.18, 0.17), 0.038, 0.4, orange, rotation=(R(78), 0, 0), vertices=6))

    head = [
        ico("Owl_Head", (0, -0.01, 2.96), (1.1, 0.78, 0.9), rust),
        ico("Face_Disc_L", (0.42, -0.68, 3.02), (0.6, 0.13, 0.59), cream),
        ico("Face_Disc_R", (-0.42, -0.68, 3.02), (0.6, 0.13, 0.59), cream),
        ico("Eye_L", (0.42, -0.82, 3.06), (0.205, 0.1, 0.235), ink),
        ico("Eye_R", (-0.42, -0.82, 3.06), (0.205, 0.1, 0.235), ink),
        ico("Pupil_L", (0.42, -0.91, 3.08), (0.072, 0.045, 0.083), lime),
        ico("Pupil_R", (-0.42, -0.91, 3.08), (0.072, 0.045, 0.083), lime),
        cone("Beak", (0, -0.92, 2.74), 0.19, 0.48, orange, rotation=(R(90), 0, 0)),
        cone("Ear_Tuft_L", (0.67, -0.02, 3.7), 0.22, 0.62, rust_light, rotation=(0, R(-12), 0)),
        cone("Ear_Tuft_R", (-0.67, -0.02, 3.7), 0.22, 0.62, rust_light, rotation=(0, R(12), 0)),
        ico("Brow_L", (0.42, -0.83, 3.34), (0.36, 0.055, 0.11), brown, rotation=(0, 0, R(-10)), subdivisions=1),
        ico("Brow_R", (-0.42, -0.83, 3.34), (0.36, 0.055, 0.11), brown, rotation=(0, 0, R(10)), subdivisions=1),
    ]
    lids_l = [ico("Eyelid_L", (0.42, -0.925, 3.08), (0.22, 0.035, 0.055), rust, subdivisions=2)]
    lids_r = [ico("Eyelid_R", (-0.42, -0.925, 3.08), (0.22, 0.035, 0.055), rust, subdivisions=2)]
    wing_l = [ico("Wing_L", (0.93, 0.02, 1.72), (0.46, 0.42, 1.1), rust, rotation=(0, R(-15), R(-8)))]
    wing_r = [ico("Wing_R", (-0.93, 0.02, 1.72), (0.46, 0.42, 1.1), rust, rotation=(0, R(15), R(8)))]
    for index, z in enumerate((1.35, 1.65, 1.95)):
        wing_l.append(ico(f"Wing_L_Feather_{index}", (1.06, -0.36, z), (0.12, 0.08, 0.34), rust_light, rotation=(0, R(-15), 0), subdivisions=1))
        wing_r.append(ico(f"Wing_R_Feather_{index}", (-1.06, -0.36, z), (0.12, 0.08, 0.34), rust_light, rotation=(0, R(15), 0), subdivisions=1))

    attach(body, rig, "body"); attach(head, rig, "head"); attach(lids_l, rig, "lid.L"); attach(lids_r, rig, "lid.R")
    attach(wing_l, rig, "wing.L"); attach(wing_r, rig, "wing.R")

    open_lids = {"lid.L": {"scale": (1, 1, 0.18)}, "lid.R": {"scale": (1, 1, 0.18)}}
    closed_lids = {"lid.L": {"scale": (1, 1, 4.1)}, "lid.R": {"scale": (1, 1, 4.1)}}
    idle = create_action(rig, "Idle", [
        (1, {"root": {"location": (0, 0, 0)}, "body": {"rotation": (0, 0, R(-1))}, "head": {"rotation": (0, 0, R(-9))}, **open_lids}),
        (28, {"root": {"location": (0, 0, 0.045)}, "body": {"rotation": (R(1), 0, R(1))}, "head": {"rotation": (R(1), 0, R(14))}, **open_lids}),
        (52, {"root": {"location": (0, 0, 0.01)}, "head": {"rotation": (0, 0, R(4))}, **open_lids}),
        (68, {"root": {"location": (0, 0, 0.035)}, "head": {"rotation": (0, 0, R(-7))}, **open_lids}),
        (72, {"head": {"rotation": (0, 0, R(-7))}, **closed_lids}),
        (76, {"head": {"rotation": (0, 0, R(-7))}, **open_lids}),
        (96, {"root": {"location": (0, 0, 0)}, "body": {"rotation": (0, 0, R(-1))}, "head": {"rotation": (0, 0, R(-9))}, **open_lids}),
    ])
    look = create_action(rig, "Look Around", [(1, {**open_lids}), (16, {"head": {"rotation": (R(-3), 0, R(42))}, **open_lids}), (34, {"head": {"rotation": (R(4), 0, R(-48))}, **open_lids}), (50, {"head": {"rotation": (R(-2), 0, R(22))}, **open_lids}), (64, {**open_lids})])
    blink = create_action(rig, "Blink", [(1, {**open_lids}), (5, {**closed_lids}), (9, {**open_lids}), (18, {**open_lids}), (22, {**closed_lids}), (26, {**open_lids}), (34, {**open_lids})])
    signal = create_action(rig, "Signal", [(1, {**open_lids}), (10, {"root": {"location": (0, 0, 0.1)}, "head": {"rotation": (R(-8), 0, 0)}, "wing.L": {"rotation": (0, R(-40), R(-32))}, "wing.R": {"rotation": (0, R(40), R(32))}, **open_lids}), (20, {"root": {"location": (0, 0, 0.02)}, "wing.L": {"rotation": (0, R(20), R(15))}, "wing.R": {"rotation": (0, R(-20), R(-15))}, **open_lids}), (30, {"root": {"location": (0, 0, 0.1)}, "wing.L": {"rotation": (0, R(-40), R(-32))}, "wing.R": {"rotation": (0, R(40), R(32))}, **open_lids}), (44, {**open_lids})])
    rig.animation_data.action = idle
    set_preview_scene("owl", target=(0, 0, 2.0))
    save_and_export("owl", rig, (idle, look, blink, signal), preview_frame=28)


def build_raven():
    reset_scene()
    black = material("Plumage / blue black", (0.012, 0.02, 0.026), metallic=0.08, roughness=0.52)
    blue = material("Plumage / iridescent edge", (0.035, 0.09, 0.13), metallic=0.18, roughness=0.42)
    charcoal = material("Beak / charcoal", (0.055, 0.06, 0.055), roughness=0.48)
    ink = material("Eyes / black", (0.003, 0.004, 0.004), roughness=0.22)
    lime = material("Eyes / agent signal", (0.68, 1.0, 0.1), metallic=0.12, roughness=0.22)
    leg = material("Feet / graphite", (0.09, 0.09, 0.075), roughness=0.7)
    rig = create_rig("Raven", [
        ("root", (0, 0, 0), (0, 0, 0.45), None),
        ("body", (0, 0.08, 0.55), (0, 0.08, 1.65), "root"),
        ("head", (0, -0.92, 1.42), (0, -0.92, 2.12), "body"),
        ("jaw", (0, -1.48, 1.62), (0, -1.9, 1.58), "head"),
        ("wing.L", (0.42, -0.35, 1.48), (0.7, 0.72, 1.2), "body"),
        ("wing.R", (-0.42, -0.35, 1.48), (-0.7, 0.72, 1.2), "body"),
        ("tail", (0, 0.7, 1.15), (0, 1.55, 1.0), "body"),
    ])
    body = [
        ico("Raven_Body", (0, 0.08, 1.24), (0.66, 1.16, 0.69), black),
        ico("Raven_Shoulders", (0, -0.58, 1.49), (0.6, 0.62, 0.58), black),
        ico("Raven_Chest", (0, -0.82, 1.27), (0.48, 0.28, 0.5), blue),
    ]
    feather_row("Chest_Ruff", (0, -1.02, 1.48), 5, 0.16, (0.09, 0.05, 0.16), blue, body)
    head = [
        ico("Raven_Head", (0, -1.12, 1.75), (0.57, 0.61, 0.53), black),
        ico("Raven_Brow", (0, -1.47, 1.91), (0.48, 0.22, 0.2), black, subdivisions=1),
        wedge("Upper_Beak", (0, -1.46, 1.69), (0, -2.12, 1.59), (0.43, 0.21), (0.055, 0.075), charcoal),
    ]
    for side in (-1, 1):
        head += [
            ico(f"Eye_{side}", (0.39 * side, -1.43, 1.87), (0.115, 0.065, 0.125), ink),
            ico(f"Pupil_{side}", (0.39 * side, -1.49, 1.88), (0.045, 0.026, 0.052), lime),
            ico(f"Nostril_{side}", (0.14 * side, -1.65, 1.75), (0.042, 0.024, 0.026), ink, subdivisions=1),
        ]
        leg_x = 0.27 * side
        ankle = (leg_x, -0.02, 0.26)
        body.append(cylinder_between(f"Leg_{side}", (leg_x, 0.12, 0.72), ankle, 0.046, leg, vertices=6))
        for toe_index, (spread_x, reach_y) in enumerate(((-0.14, -0.38), (0, -0.43), (0.14, -0.36))):
            knuckle = (leg_x + spread_x * 0.48, -0.17, 0.19)
            toe_tip = (leg_x + spread_x, reach_y, 0.14)
            claw_tip = (leg_x + spread_x, reach_y - 0.08, 0.105)
            body.append(cylinder_between(f"Toe_{side}_{toe_index}_A", ankle, knuckle, 0.025, leg, vertices=5))
            body.append(cylinder_between(f"Toe_{side}_{toe_index}_B", knuckle, toe_tip, 0.019, leg, vertices=5))
            body.append(cylinder_between(f"Claw_{side}_{toe_index}", toe_tip, claw_tip, 0.012, ink, vertices=5))
        rear_knuckle = (leg_x, 0.13, 0.18)
        rear_tip = (leg_x, 0.26, 0.13)
        body.append(cylinder_between(f"Rear_Toe_{side}_A", ankle, rear_knuckle, 0.023, leg, vertices=5))
        body.append(cylinder_between(f"Rear_Toe_{side}_B", rear_knuckle, rear_tip, 0.016, leg, vertices=5))
    jaw = [
        wedge("Lower_Beak", (0, -1.47, 1.56), (0, -2.02, 1.56), (0.35, 0.065), (0.045, 0.035), charcoal),
    ]
    wing_l = [ico("Wing_L", (0.61, 0.02, 1.33), (0.24, 1.03, 0.46), black, rotation=(0, R(-6), R(-4)))]
    wing_r = [ico("Wing_R", (-0.61, 0.02, 1.33), (0.24, 1.03, 0.46), black, rotation=(0, R(6), R(4)))]
    for index, offset in enumerate((-0.18, 0.0, 0.18)):
        wing_l.append(ico(f"Wing_L_Quill_{index}", (0.73, 0.24 + offset, 1.2 - index * 0.06), (0.09, 0.75, 0.14), blue, rotation=(0, R(-6), R(-4)), subdivisions=1))
        wing_r.append(ico(f"Wing_R_Quill_{index}", (-0.73, 0.24 + offset, 1.2 - index * 0.06), (0.09, 0.75, 0.14), blue, rotation=(0, R(6), R(4)), subdivisions=1))
    tail = [
        wedge(
            f"Tail_Quill_{index}",
            (x, 0.72, 1.15 - abs(x) * 0.08),
            (x, 2.25 - abs(x) * 0.45, 0.96 - abs(x) * 0.15),
            (0.18, 0.16),
            (0.1, 0.065),
            blue,
        )
        for index, x in enumerate((-0.3, -0.15, 0, 0.15, 0.3))
    ]
    attach(body, rig, "body"); attach(head, rig, "head"); attach(jaw, rig, "jaw"); attach(wing_l, rig, "wing.L"); attach(wing_r, rig, "wing.R"); attach(tail, rig, "tail")
    idle = create_action(rig, "Idle", [(1, {"head": {"rotation": (0, 0, R(-4))}}), (24, {"root": {"location": (0, 0, 0.025)}, "body": {"rotation": (R(0.7), 0, 0)}, "head": {"rotation": (R(-2), 0, R(9))}, "tail": {"rotation": (R(1.5), 0, R(-2))}}), (48, {"head": {"rotation": (0, 0, R(-4))}}), (72, {"root": {"location": (0, 0, 0.02)}, "head": {"rotation": (R(3), 0, R(-14))}}), (92, {"head": {"rotation": (0, 0, R(-4))}})])
    scan = create_action(rig, "Scan", [(1, {}), (10, {"head": {"rotation": (R(6), 0, R(29))}}), (21, {"head": {"rotation": (R(-8), 0, R(-34))}}), (34, {"head": {"rotation": (R(2), 0, R(15))}}), (48, {})])
    call = create_action(rig, "Call", [(1, {}), (6, {"head": {"rotation": (R(-6), 0, 0)}, "jaw": {"rotation": (R(16), 0, 0)}}), (11, {"jaw": {"rotation": (R(-1), 0, 0)}}), (17, {"head": {"rotation": (R(-4), 0, 0)}, "jaw": {"rotation": (R(18), 0, 0)}}), (24, {})])
    signal = create_action(rig, "Signal", [(1, {}), (9, {"root": {"location": (0, 0, 0.07)}, "wing.L": {"rotation": (0, R(-42), R(-26))}, "wing.R": {"rotation": (0, R(42), R(26))}}), (18, {"wing.L": {"rotation": (0, R(18), R(12))}, "wing.R": {"rotation": (0, R(-18), R(-12))}}), (27, {"wing.L": {"rotation": (0, R(-42), R(-26))}, "wing.R": {"rotation": (0, R(42), R(26))}}), (40, {})])
    rig.animation_data.action = idle
    set_preview_scene("raven", target=(0, 0, 1.3), camera_location=(6.8, -7.0, 3.15))
    save_and_export("raven", rig, (idle, scan, call, signal), preview_frame=24)


def build_beaver():
    reset_scene()
    brown = material("Fur / walnut", (0.27, 0.105, 0.04), roughness=0.9)
    warm = material("Fur / warm flank", (0.55, 0.23, 0.065), roughness=0.86)
    cream = material("Fur / muzzle and belly", (0.78, 0.54, 0.28), roughness=0.88)
    tail_mat = material("Tail / leather", (0.18, 0.085, 0.035), roughness=0.76)
    tooth = material("Teeth / ivory", (0.96, 0.86, 0.58), roughness=0.55)
    ink = material("Eyes / midnight", (0.008, 0.01, 0.008), roughness=0.3)
    lime = material("Eyes / agent signal", (0.66, 1.0, 0.08), metallic=0.08, roughness=0.24)
    rig = create_rig("Beaver", [
        ("root", (0, 0, 0), (0, 0, 0.45), None), ("body", (0, 0, 0.45), (0, 0, 1.9), "root"),
        ("head", (0, -0.15, 1.65), (0, -0.3, 2.55), "body"), ("jaw", (0, -0.85, 1.85), (0, -1.05, 1.75), "head"),
        ("arm.L", (0.42, -0.38, 1.55), (0.72, -0.72, 1.0), "body"), ("arm.R", (-0.42, -0.38, 1.55), (-0.72, -0.72, 1.0), "body"),
        ("tail", (0, 0.5, 0.72), (0, 1.3, 0.45), "body"),
    ])
    body = [ico("Beaver_Body", (0, 0, 1.08), (1.18, 0.82, 0.92), brown), ico("Beaver_Belly", (0, -0.72, 1.04), (0.68, 0.13, 0.62), cream)]
    for side in (-1, 1):
        body.append(ico(f"Hind_Foot_{side}", (0.55 * side, -0.18, 0.26), (0.4, 0.55, 0.18), tail_mat, subdivisions=1))
    head = [ico("Beaver_Head", (0, -0.45, 1.88), (0.82, 0.68, 0.67), warm), ico("Muzzle_L", (0.28, -0.98, 1.72), (0.36, 0.2, 0.28), cream), ico("Muzzle_R", (-0.28, -0.98, 1.72), (0.36, 0.2, 0.28), cream), ico("Nose", (0, -1.19, 1.88), (0.24, 0.13, 0.17), ink)]
    for side in (-1, 1):
        head += [ico(f"Ear_{side}", (0.58 * side, -0.2, 2.28), (0.24, 0.13, 0.27), tail_mat, subdivisions=1), ico(f"Eye_{side}", (0.34 * side, -0.96, 2.08), (0.13, 0.07, 0.145), ink), ico(f"Pupil_{side}", (0.34 * side, -1.025, 2.1), (0.05, 0.025, 0.058), lime)]
    jaw = [cube("Incisor_L", (0.11, -1.16, 1.55), (0.105, 0.065, 0.28), tooth, bevel=0.035), cube("Incisor_R", (-0.11, -1.16, 1.55), (0.105, 0.065, 0.28), tooth, bevel=0.035)]
    arms_l = [ico("Forepaw_L", (0.62, -0.7, 1.02), (0.24, 0.22, 0.52), warm, rotation=(R(-16), 0, R(-18)), subdivisions=1)]
    arms_r = [ico("Forepaw_R", (-0.62, -0.7, 1.02), (0.24, 0.22, 0.52), warm, rotation=(R(-16), 0, R(18)), subdivisions=1)]
    tail = [ico("Beaver_Tail", (0, 0.95, 0.55), (0.58, 0.18, 0.95), tail_mat, rotation=(R(20), 0, 0), subdivisions=2)]
    for z in (0.25, 0.55, 0.85):
        tail.append(cylinder(f"Tail_Ridge_{z}", (0, 0.78 + z * 0.18, z), 0.035, 0.88, warm, rotation=(0, R(90), 0), vertices=6))
    attach(body, rig, "body"); attach(head, rig, "head"); attach(jaw, rig, "jaw"); attach(arms_l, rig, "arm.L"); attach(arms_r, rig, "arm.R"); attach(tail, rig, "tail")
    idle = create_action(rig, "Idle", [(1, {"tail": {"rotation": (0, 0, R(-4))}}), (28, {"root": {"location": (0, 0, 0.035)}, "body": {"scale": (1.015, 1.015, 1.03)}, "head": {"rotation": (R(2), 0, R(4))}, "tail": {"rotation": (0, 0, R(7))}}), (56, {"tail": {"rotation": (0, 0, R(-4))}}), (84, {"root": {"location": (0, 0, 0.025)}, "head": {"rotation": (R(-2), 0, R(-5))}, "tail": {"rotation": (0, 0, R(4))}}), (104, {"tail": {"rotation": (0, 0, R(-4))}})])
    gnaw = create_action(rig, "Gnaw", [(1, {}), (5, {"jaw": {"rotation": (R(12), 0, 0)}, "arm.L": {"rotation": (0, R(-8), R(-8))}, "arm.R": {"rotation": (0, R(8), R(8))}}), (10, {"jaw": {"rotation": (R(-3), 0, 0)}}), (15, {"jaw": {"rotation": (R(13), 0, 0)}}), (20, {}), (25, {"jaw": {"rotation": (R(11), 0, 0)}}), (32, {})])
    tail_sweep = create_action(rig, "Tail Sweep", [(1, {}), (14, {"body": {"rotation": (0, 0, R(-3))}, "tail": {"rotation": (0, R(-5), R(-34))}}), (28, {"body": {"rotation": (0, 0, R(3))}, "tail": {"rotation": (0, R(4), R(36))}}), (42, {})])
    build = create_action(rig, "Build", [(1, {}), (9, {"head": {"rotation": (R(10), 0, 0)}, "arm.L": {"rotation": (R(-24), R(-18), R(-12))}, "arm.R": {"rotation": (R(16), R(18), R(12))}}), (18, {"head": {"rotation": (R(-4), 0, 0)}, "arm.L": {"rotation": (R(16), R(-10), R(8))}, "arm.R": {"rotation": (R(-24), R(10), R(-8))}}), (27, {"arm.L": {"rotation": (R(-22), R(-18), R(-12))}, "arm.R": {"rotation": (R(18), R(18), R(12))}}), (40, {})])
    rig.animation_data.action = idle
    set_preview_scene("beaver", target=(0, 0, 1.3), camera_location=(5.8, -8.8, 3.4))
    save_and_export("beaver", rig, (idle, gnaw, tail_sweep, build), preview_frame=28)


def build_meerkat():
    reset_scene()
    sand = material("Fur / desert sand", (0.64, 0.38, 0.14), roughness=0.9)
    light = material("Fur / warm belly", (0.88, 0.67, 0.36), roughness=0.88)
    dark = material("Mask / umber", (0.16, 0.065, 0.025), roughness=0.82)
    ink = material("Eyes / midnight", (0.006, 0.009, 0.007), roughness=0.28)
    lime = material("Eyes / agent signal", (0.66, 1.0, 0.08), metallic=0.08, roughness=0.24)
    rig = create_rig("Meerkat", [
        ("root", (0, 0, 0), (0, 0, 0.55), None), ("body", (0, 0, 0.55), (0, 0, 2.35), "root"),
        ("head", (0, 0, 2.28), (0, 0, 3.22), "body"), ("arm.L", (0.35, -0.2, 1.9), (0.52, -0.55, 1.25), "body"),
        ("arm.R", (-0.35, -0.2, 1.9), (-0.52, -0.55, 1.25), "body"), ("tail", (0, 0.35, 0.78), (0, 1.25, 0.2), "body"),
    ])
    body = [ico("Meerkat_Body", (0, 0, 1.42), (0.68, 0.54, 1.18), sand), ico("Meerkat_Belly", (0, -0.5, 1.46), (0.43, 0.12, 0.84), light)]
    for side in (-1, 1):
        body += [cylinder(f"Leg_{side}", (0.29 * side, 0, 0.43), 0.075, 0.66, dark, vertices=7), ico(f"Foot_{side}", (0.29 * side, -0.18, 0.13), (0.2, 0.34, 0.11), dark, subdivisions=1)]
    head = [ico("Meerkat_Head", (0, -0.06, 2.64), (0.66, 0.56, 0.61), sand), ico("Meerkat_Muzzle", (0, -0.64, 2.45), (0.39, 0.28, 0.25), light), ico("Meerkat_Nose", (0, -0.91, 2.47), (0.14, 0.09, 0.1), ink)]
    for side in (-1, 1):
        head += [ico(f"Ear_{side}", (0.54 * side, -0.05, 2.88), (0.22, 0.12, 0.24), dark, subdivisions=1), ico(f"Eye_Patch_{side}", (0.29 * side, -0.55, 2.7), (0.28, 0.08, 0.2), dark), ico(f"Eye_{side}", (0.29 * side, -0.625, 2.71), (0.105, 0.055, 0.115), ink), ico(f"Pupil_{side}", (0.29 * side, -0.678, 2.72), (0.043, 0.022, 0.047), lime)]
    arms_l = [ico("Arm_L", (0.43, -0.48, 1.47), (0.16, 0.15, 0.62), sand, rotation=(R(-18), 0, R(-12)), subdivisions=1), ico("Paw_L", (0.31, -0.72, 1.05), (0.18, 0.16, 0.2), dark, subdivisions=1)]
    arms_r = [ico("Arm_R", (-0.43, -0.48, 1.47), (0.16, 0.15, 0.62), sand, rotation=(R(-18), 0, R(12)), subdivisions=1), ico("Paw_R", (-0.31, -0.72, 1.05), (0.18, 0.16, 0.2), dark, subdivisions=1)]
    tail = [ico("Meerkat_Tail", (0, 0.72, 0.74), (0.22, 0.2, 1.15), sand, rotation=(R(38), 0, 0), subdivisions=2), ico("Tail_Tip", (0, 1.13, 0.2), (0.19, 0.18, 0.36), dark, rotation=(R(38), 0, 0), subdivisions=1)]
    attach(body, rig, "body"); attach(head, rig, "head"); attach(arms_l, rig, "arm.L"); attach(arms_r, rig, "arm.R"); attach(tail, rig, "tail")
    idle = create_action(rig, "Idle", [(1, {"head": {"rotation": (0, 0, R(-5))}, "tail": {"rotation": (0, 0, R(-3))}}), (26, {"root": {"location": (0, 0, 0.04)}, "body": {"scale": (1.01, 1.01, 1.025)}, "head": {"rotation": (R(2), 0, R(10))}, "tail": {"rotation": (0, 0, R(7))}}), (52, {"head": {"rotation": (0, 0, R(-5))}, "tail": {"rotation": (0, 0, R(-3))}}), (78, {"root": {"location": (0, 0, 0.03)}, "head": {"rotation": (R(-2), 0, R(-12))}, "tail": {"rotation": (0, 0, R(4))}}), (96, {"head": {"rotation": (0, 0, R(-5))}, "tail": {"rotation": (0, 0, R(-3))}})])
    lookout = create_action(rig, "Lookout", [(1, {}), (16, {"root": {"location": (0, 0, 0.22)}, "body": {"rotation": (R(-4), 0, 0)}, "head": {"rotation": (R(-8), 0, 0)}, "arm.L": {"rotation": (R(18), 0, R(-14))}, "arm.R": {"rotation": (R(18), 0, R(14))}}), (38, {"root": {"location": (0, 0, 0.22)}, "head": {"rotation": (R(-4), 0, R(24))}}), (54, {})])
    scan = create_action(rig, "Scan", [(1, {}), (12, {"head": {"rotation": (R(2), 0, R(44))}}), (26, {"head": {"rotation": (R(-3), 0, R(-48))}}), (40, {"head": {"rotation": (R(1), 0, R(20))}}), (54, {})])
    alert = create_action(rig, "Alert", [(1, {}), (7, {"root": {"location": (0, 0, 0.1)}, "head": {"rotation": (R(-10), 0, 0)}, "arm.L": {"rotation": (R(-25), R(-8), R(-26))}, "arm.R": {"rotation": (R(-25), R(8), R(26))}, "tail": {"rotation": (0, 0, R(18))}}), (14, {"root": {"location": (0, 0, 0.02)}}), (22, {"root": {"location": (0, 0, 0.1)}, "head": {"rotation": (R(-8), 0, R(-10))}, "tail": {"rotation": (0, 0, R(-15))}}), (34, {})])
    rig.animation_data.action = idle
    set_preview_scene("meerkat", target=(0, 0, 1.7))
    save_and_export("meerkat", rig, (idle, lookout, scan, alert), preview_frame=26)
