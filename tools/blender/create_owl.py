"""Build the first AI Agent Zoo character and export it for the web.

Run with:
  blender --background --python tools/blender/create_owl.py
"""

from pathlib import Path
import math

import bpy
from mathutils import Euler, Vector


ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = ROOT / "public" / "models"
SOURCE_DIR = ROOT / "assets" / "3d"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
SOURCE_DIR.mkdir(parents=True, exist_ok=True)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.armatures, bpy.data.materials):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def material(name, color, metallic=0.0, roughness=0.7):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat


def finish_mesh(obj, name, mat, scale, rotation=(0.0, 0.0, 0.0), smooth=True):
    obj.name = name
    obj.scale = scale
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if smooth:
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    obj.data.materials.append(mat)
    return obj


def ico(name, location, scale, mat, rotation=(0.0, 0.0, 0.0), subdivisions=2):
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=subdivisions,
        radius=1.0,
        location=location,
    )
    return finish_mesh(bpy.context.object, name, mat, scale, rotation)


def cone(name, location, radius, depth, mat, rotation=(0.0, 0.0, 0.0), vertices=8):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius,
        radius2=0.0,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    return finish_mesh(bpy.context.object, name, mat, (1.0, 1.0, 1.0), smooth=False)


def cylinder(name, location, radius, depth, mat, rotation=(0.0, 0.0, 0.0), vertices=8):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    return finish_mesh(bpy.context.object, name, mat, (1.0, 1.0, 1.0), smooth=False)


def parent_to_bone(obj, rig, bone_name):
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world


def create_rig():
    armature = bpy.data.armatures.new("OwlRig")
    rig = bpy.data.objects.new("OwlRig", armature)
    bpy.context.collection.objects.link(rig)
    rig.show_in_front = True
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    root = armature.edit_bones.new("root")
    root.head = (0.0, 0.0, 0.0)
    root.tail = (0.0, 0.0, 0.65)

    body = armature.edit_bones.new("body")
    body.head = (0.0, 0.0, 0.65)
    body.tail = (0.0, 0.0, 2.65)
    body.parent = root

    head = armature.edit_bones.new("head")
    head.head = (0.0, 0.0, 2.55)
    head.tail = (0.0, 0.0, 3.55)
    head.parent = body
    head.use_connect = False

    wing_l = armature.edit_bones.new("wing.L")
    wing_l.head = (0.45, 0.0, 2.3)
    wing_l.tail = (1.2, 0.0, 1.55)
    wing_l.parent = body

    wing_r = armature.edit_bones.new("wing.R")
    wing_r.head = (-0.45, 0.0, 2.3)
    wing_r.tail = (-1.2, 0.0, 1.55)
    wing_r.parent = body

    bpy.ops.object.mode_set(mode="OBJECT")
    return rig


def set_pose(rig, root_z=0.0, body=(0.0, 0.0, 0.0), head=(0.0, 0.0, 0.0), wing_l=(0.0, 0.0, 0.0), wing_r=(0.0, 0.0, 0.0)):
    values = {
        "body": body,
        "head": head,
        "wing.L": wing_l,
        "wing.R": wing_r,
    }
    root = rig.pose.bones["root"]
    root.location = (0.0, 0.0, root_z)
    for bone_name, rotation in values.items():
        bone = rig.pose.bones[bone_name]
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = Euler(rotation, "XYZ")


def insert_pose(rig, frame):
    bpy.context.scene.frame_set(frame)
    rig.pose.bones["root"].keyframe_insert("location", frame=frame)
    for bone_name in ("body", "head", "wing.L", "wing.R"):
        rig.pose.bones[bone_name].keyframe_insert("rotation_euler", frame=frame)


def create_action(rig, name, keyframes):
    action = bpy.data.actions.new(name=name)
    action.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = action
    for frame, pose in keyframes:
        set_pose(rig, **pose)
        insert_pose(rig, frame)
    return action


def build_character():
    brown = material("Feathers / burnt umber", (0.36, 0.13, 0.055), roughness=0.82)
    rust = material("Feathers / zoo orange", (0.86, 0.28, 0.075), roughness=0.78)
    cream = material("Face / warm cream", (1.0, 0.79, 0.48), roughness=0.72)
    ink = material("Eyes / midnight", (0.008, 0.012, 0.01), roughness=0.32)
    lime = material("Eyes / agent signal", (0.68, 1.0, 0.10), metallic=0.08, roughness=0.26)
    orange = material("Beak and talons", (1.0, 0.42, 0.025), roughness=0.55)

    rig = create_rig()
    body_parts = []
    head_parts = []
    left_wing_parts = []
    right_wing_parts = []

    body_parts.append(ico("Owl_Body", (0.0, 0.0, 1.65), (1.05, 0.72, 1.35), brown))
    body_parts.append(ico("Owl_Chest", (0.0, -0.62, 1.55), (0.68, 0.18, 0.86), cream))

    head_parts.append(ico("Owl_Head", (0.0, -0.01, 3.0), (1.12, 0.78, 0.92), rust))
    head_parts.append(ico("Face_Disc_L", (0.43, -0.69, 3.06), (0.61, 0.13, 0.61), cream))
    head_parts.append(ico("Face_Disc_R", (-0.43, -0.69, 3.06), (0.61, 0.13, 0.61), cream))
    head_parts.append(ico("Eye_L", (0.43, -0.82, 3.11), (0.20, 0.10, 0.23), ink))
    head_parts.append(ico("Eye_R", (-0.43, -0.82, 3.11), (0.20, 0.10, 0.23), ink))
    head_parts.append(ico("Signal_Pupil_L", (0.43, -0.91, 3.13), (0.072, 0.045, 0.082), lime, subdivisions=2))
    head_parts.append(ico("Signal_Pupil_R", (-0.43, -0.91, 3.13), (0.072, 0.045, 0.082), lime, subdivisions=2))
    head_parts.append(cone("Beak", (0.0, -0.91, 2.79), 0.19, 0.48, orange, rotation=(math.radians(90), 0.0, 0.0)))
    head_parts.append(cone("Ear_Tuft_L", (0.68, -0.02, 3.74), 0.23, 0.62, rust, rotation=(0.0, math.radians(-12), 0.0)))
    head_parts.append(cone("Ear_Tuft_R", (-0.68, -0.02, 3.74), 0.23, 0.62, rust, rotation=(0.0, math.radians(12), 0.0)))

    left_wing_parts.append(ico("Wing_L", (0.94, 0.02, 1.76), (0.48, 0.42, 1.12), rust, rotation=(0.0, math.radians(-15), math.radians(-8))))
    right_wing_parts.append(ico("Wing_R", (-0.94, 0.02, 1.76), (0.48, 0.42, 1.12), rust, rotation=(0.0, math.radians(15), math.radians(8))))

    for side in (-1.0, 1.0):
        body_parts.append(cylinder(f"Leg_{'L' if side > 0 else 'R'}", (0.38 * side, 0.0, 0.42), 0.09, 0.45, orange, vertices=7))
        for toe_index, toe_x in enumerate((-0.13, 0.0, 0.13)):
            body_parts.append(
                cylinder(
                    f"Toe_{'L' if side > 0 else 'R'}_{toe_index + 1}",
                    (0.38 * side + toe_x, -0.18, 0.22),
                    0.045,
                    0.42,
                    orange,
                    rotation=(math.radians(78), 0.0, 0.0),
                    vertices=6,
                )
            )

    for obj in body_parts:
        parent_to_bone(obj, rig, "body")
    for obj in head_parts:
        parent_to_bone(obj, rig, "head")
    for obj in left_wing_parts:
        parent_to_bone(obj, rig, "wing.L")
    for obj in right_wing_parts:
        parent_to_bone(obj, rig, "wing.R")

    idle = create_action(
        rig,
        "Idle",
        [
            (1, {"root_z": 0.0, "head": (0.0, 0.0, -0.03), "wing_l": (0.0, -0.02, -0.03), "wing_r": (0.0, 0.02, 0.03)}),
            (20, {"root_z": 0.055, "head": (0.015, 0.0, 0.03), "wing_l": (0.0, 0.025, 0.015), "wing_r": (0.0, -0.025, -0.015)}),
            (40, {"root_z": 0.0, "head": (0.0, 0.0, -0.03), "wing_l": (0.0, -0.02, -0.03), "wing_r": (0.0, 0.02, 0.03)}),
        ],
    )
    inspect = create_action(
        rig,
        "Inspect",
        [
            (1, {"head": (0.0, 0.0, 0.0)}),
            (12, {"head": (0.02, 0.0, math.radians(34))}),
            (24, {"head": (-0.04, 0.0, math.radians(-38))}),
            (36, {"head": (0.0, 0.0, math.radians(18))}),
            (48, {"head": (0.0, 0.0, 0.0)}),
        ],
    )
    sleep = create_action(
        rig,
        "Sleep",
        [
            (1, {"root_z": 0.0, "body": (0.0, 0.0, 0.0), "head": (0.0, 0.0, 0.0)}),
            (18, {"root_z": -0.18, "body": (math.radians(5), 0.0, 0.0), "head": (math.radians(16), 0.0, math.radians(10)), "wing_l": (0.0, math.radians(8), math.radians(8)), "wing_r": (0.0, math.radians(-8), math.radians(-8))}),
            (42, {"root_z": -0.15, "body": (math.radians(4), 0.0, 0.0), "head": (math.radians(14), 0.0, math.radians(7)), "wing_l": (0.0, math.radians(7), math.radians(7)), "wing_r": (0.0, math.radians(-7), math.radians(-7))}),
            (60, {"root_z": -0.18, "body": (math.radians(5), 0.0, 0.0), "head": (math.radians(16), 0.0, math.radians(10)), "wing_l": (0.0, math.radians(8), math.radians(8)), "wing_r": (0.0, math.radians(-8), math.radians(-8))}),
        ],
    )
    signal = create_action(
        rig,
        "Signal",
        [
            (1, {"root_z": 0.0}),
            (8, {"root_z": 0.12, "head": (math.radians(-8), 0.0, 0.0), "wing_l": (0.0, math.radians(-42), math.radians(-34)), "wing_r": (0.0, math.radians(42), math.radians(34))}),
            (16, {"root_z": 0.03, "head": (0.0, 0.0, math.radians(-8)), "wing_l": (0.0, math.radians(25), math.radians(18)), "wing_r": (0.0, math.radians(-25), math.radians(-18))}),
            (24, {"root_z": 0.12, "head": (math.radians(-8), 0.0, math.radians(8)), "wing_l": (0.0, math.radians(-42), math.radians(-34)), "wing_r": (0.0, math.radians(42), math.radians(34))}),
            (36, {"root_z": 0.0}),
        ],
    )

    rig.animation_data.action = idle
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = 60
    bpy.context.scene.render.fps = 30
    bpy.context.scene.frame_set(1)
    return rig, (idle, inspect, sleep, signal)


def set_preview_scene():
    world = bpy.context.scene.world
    world.color = (0.003, 0.008, 0.004)
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.003, 0.008, 0.004, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.32

    bpy.ops.object.light_add(type="AREA", location=(4.0, -5.0, 6.5))
    key = bpy.context.object
    key.name = "Key_Light"
    key.data.energy = 850
    key.data.shape = "DISK"
    key.data.size = 4.0
    key.data.color = (0.72, 1.0, 0.54)
    key.rotation_euler = (math.radians(24), 0.0, math.radians(38))

    bpy.ops.object.light_add(type="AREA", location=(-4.0, 1.5, 4.0))
    fill = bpy.context.object
    fill.name = "Fill_Light"
    fill.data.energy = 620
    fill.data.size = 3.0
    fill.data.color = (1.0, 0.27, 0.08)
    fill.rotation_euler = (math.radians(70), 0.0, math.radians(-100))

    bpy.ops.object.camera_add(location=(5.8, -8.6, 4.3))
    camera = bpy.context.object
    camera.name = "Preview_Camera"
    bpy.context.scene.camera = camera
    camera.data.lens = 58

    direction = Vector((0.0, 0.0, 2.0)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(MODEL_DIR / "owl-preview.png")


def main():
    reset_scene()
    rig, actions = build_character()
    set_preview_scene()

    bpy.context.scene.frame_set(10)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.context.scene.render.filepath = str(MODEL_DIR / "owl-preview.png")
    bpy.ops.render.render(write_still=True)

    blend_path = SOURCE_DIR / "owl-agent.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

    bpy.context.view_layer.objects.active = rig
    rig.animation_data.action = actions[0]
    bpy.ops.export_scene.gltf(
        filepath=str(MODEL_DIR / "owl-agent.glb"),
        export_format="GLB",
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_force_sampling=True,
        export_frame_range=False,
        export_optimize_animation_size=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
    )
    print(f"Saved Blender source: {blend_path}")
    print(f"Saved web model: {MODEL_DIR / 'owl-agent.glb'}")
    print("Animations:", ", ".join(action.name for action in actions))


if __name__ == "__main__":
    main()
