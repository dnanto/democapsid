import bpy


class CapsidMesh(bpy.types.Operator):
    """Add icosahedral capsid mesh."""
    bl_idname = "object.add_mesh"
    bl_label = "Add Capsid Mesh"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        from blendocapsid.modules.democapsid.democapsid import (calc_ckm,
                                                                calc_ico,
                                                                calc_lattice)
        
        m, a, s = "ico", 5, 0
        ckp = (3, 1, 4, 2)
        lat = calc_lattice("hex", 1)

        if m == "ico":
            meshes = calc_ico(ckp, lat, a=a, s=s)
        elif m == "tri":
            meshes = calc_ckm(ckp, lat)

        for i, mesh in enumerate(meshes[1:], start=1):
            collection = bpy.data.collections.new(f"face-{i}")
            bpy.context.scene.collection.children.link(collection)
            for j, polygon in enumerate(mesh, start=1):
                mesh = bpy.data.meshes.new(name=f"polygon_msh[{i},{j}]")
                mesh.from_pydata(*polygon, [])
                mesh.validate(verbose=True)
                obj = bpy.data.objects.new(f"polygon_obj-[{i},{j}]", mesh)
                collection.objects.link(obj)

        return {"FINISHED"}


def menu_func(self, context):
    self.layout.operator(CapsidMesh.bl_idname)


def register():
    bpy.utils.register_class(CapsidMesh)
    bpy.types.VIEW3D_MT_object.append(menu_func)


def unregister():
    bpy.utils.unregister_class(CapsidMesh)
