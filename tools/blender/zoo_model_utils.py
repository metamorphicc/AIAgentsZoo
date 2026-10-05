"""Shared low-poly modelling, rigging, preview, and GLB export helpers."""

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
    for blocks in (bpy.data.meshes, bpy.data.curves, bpy.data.armatures, bpy.data.materials, bpy.data.actions):
        for item in list(blocks):
            if item.users == 0:
                blocks.remove(item)


def material(name, color, metallic=0.0, roughness=0.72):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat


def finish_mesh(obj, name, mat, scale=(1.0, 1.0, 1.0), rotation=(0.0, 0.0, 0.0), smooth=True):
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
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1.0, location=location)
    return finish_mesh(bpy.context.object, name, mat, scale, rotation)


def cone(name, location, radius, depth, mat, rotation=(0.0, 0.0, 0.0), vertices=8):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=0.0, depth=depth, location=location, rotation=rotation)
    return finish_mesh(bpy.context.object, name, mat, smooth=False)


def cylinder(name, location, radius, depth, mat, rotation=(0.0, 0.0, 0.0), vertices=8):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    return finish_mesh(bpy.context.object, name, mat, smooth=False)


def cube(name, location, scale, mat, rotation=(0.0, 0.0, 0.0), bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location, rotation=rotation)
    obj = finish_mesh(bpy.context.object, name, mat, scale, smooth=False)
    if bevel:
        modifier = obj.modifiers.new("Soft edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def create_rig(name, bones):
    armature = bpy.data.armatures.new(f"{name}Rig")
    rig = bpy.data.objects.new(f"{name}Rig", armature)
    bpy.context.collection.objects.link(rig)
    rig.show_in_front = True
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    created = {}
    for bone_name, head, tail, parent_name in bones:
        bone = armature.edit_bones.new(bone_name)
        bone.head = head
        bone.tail = tail
        if parent_name:
            bone.parent = created[parent_name]
        created[bone_name] = bone

    bpy.ops.object.mode_set(mode="OBJECT")
    return rig


def parent_to_bone(obj, rig, bone_name):
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world


def attach(objects, rig, bone_name):
    for obj in objects:
        parent_to_bone(obj, rig, bone_name)


def reset_pose(rig):
    for bone in rig.pose.bones:
        bone.rotation_mode = "XYZ"
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_euler = Euler((0.0, 0.0, 0.0), "XYZ")
        bone.scale = (1.0, 1.0, 1.0)


def apply_pose(rig, pose):
    reset_pose(rig)
    for bone_name, channels in pose.items():
        bone = rig.pose.bones[bone_name]
        if "location" in channels:
            bone.location = channels["location"]
        if "rotation" in channels:
            bone.rotation_euler = Euler(channels["rotation"], "XYZ")
        if "scale" in channels:
            bone.scale = channels["scale"]


def insert_pose(rig, frame):
    bpy.context.scene.frame_set(frame)
    for bone in rig.pose.bones:
        bone.keyframe_insert("location", frame=frame)
        bone.keyframe_insert("rotation_euler", frame=frame)
        bone.keyframe_insert("scale", frame=frame)


def create_action(rig, name, keyframes):
    action = bpy.data.actions.new(name=name)
    action.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = action
    for frame, pose in keyframes:
        apply_pose(rig, pose)
        insert_pose(rig, frame)
    return action


def feather_row(prefix, center, count, spacing, scale, mat, parent_parts):
    start = -((count - 1) * spacing) / 2
    for index in range(count):
        x = center[0] + start + index * spacing
        parent_parts.append(ico(f"{prefix}_{index + 1}", (x, center[1], center[2]), scale, mat, subdivisions=1))


def set_preview_scene(species, target=(0.0, 0.0, 1.8), camera_location=(5.8, -8.6, 4.3)):
    world = bpy.context.scene.world
    world.color = (0.003, 0.008, 0.004)
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.003, 0.008, 0.004, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.3

    bpy.ops.object.light_add(type="AREA", location=(4.0, -5.0, 6.5))
    key = bpy.context.object
    key.name = "Key_Light"
    key.data.energy = 900
    key.data.shape = "DISK"
    key.data.size = 4.0
    key.data.color = (0.72, 1.0, 0.54)
    key.rotation_euler = (math.radians(24), 0.0, math.radians(38))

    bpy.ops.object.light_add(type="AREA", location=(-4.0, 1.5, 4.0))
    fill = bpy.context.object
    fill.name = "Fill_Light"
    fill.data.energy = 560
    fill.data.size = 3.0
    fill.data.color = (1.0, 0.31, 0.12)
    fill.rotation_euler = (math.radians(70), 0.0, math.radians(-100))

    bpy.ops.object.camera_add(location=camera_location)
    camera = bpy.context.object
    camera.name = "Preview_Camera"
    bpy.context.scene.camera = camera
    camera.data.lens = 58
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(MODEL_DIR / f"{species}-preview.png")


def save_and_export(species, rig, actions, preview_frame=1):
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = max(int(action.frame_range[1]) for action in actions)
    bpy.context.scene.render.fps = 30
    bpy.context.scene.frame_set(preview_frame)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.render.render(write_still=True)

    blend_path = SOURCE_DIR / f"{species}-agent.blend"
    glb_path = MODEL_DIR / f"{species}-agent.glb"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    rig.animation_data.action = actions[0]
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
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
    print(f"Saved web model: {glb_path}")
    print("Animations:", ", ".join(action.name for action in actions))
