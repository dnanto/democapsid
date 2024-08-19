import bpy


class CapsidMesh(bpy.types.Operator):
    """Add icosahedral capsid mesh."""
    bl_idname = "mesh.capsid"
    bl_label = "Capsid"
    bl_options = {"REGISTER", "UNDO"}
    axis_items = [
        ("2", "2", "two-fold axial symmetry", 2),
        ("3", "3", "three-fold axial symmetry", 3),
        ("5", "5", "five-fold axial symmetry", 5)
    ]
    tile_items = [
        (key, key, f"{key} lattice", idx)
        for idx, key in enumerate((pfx + ele for pfx in ("", "dual") for ele in ("hex", "trihex", "snubhex", "rhombitrihex")), start=1)
    ]
    mode_items = [
        ("ico", "ico", "render icosahedral mesh", 1),
        ("tri", "tri", "render triangular Caspar-Klug meshes", 2)
    ]

    h: bpy.props.IntProperty(name="h", description="the h Caspar-Klug parameter", default=1, min=0)
    k: bpy.props.IntProperty(name="k", description="the k Caspar-Klug parameter", default=0, min=0)
    H: bpy.props.IntProperty(name="H", description="the H Caspar-Klug parameter", default=1, min=0)
    K: bpy.props.IntProperty(name="K", description="the K Caspar-Klug parameter", default=0, min=0)
    a: bpy.props.EnumProperty(name="a", description="the axial symmetry", items=axis_items, default=axis_items[2][3])
    R: bpy.props.FloatProperty(name="R", description="the hexagonal lattice unit circumradius", default=1, min=0)
    t: bpy.props.EnumProperty(name="t", description="the hexagonal lattice unit tile", items=tile_items, default=tile_items[0][3])
    s: bpy.props.FloatProperty(name="s", description="the sphericity value", default=0, min=-1, max=1)
    m: bpy.props.EnumProperty(name="mode", description="the render mode", items=mode_items, default=mode_items[0][3])
    iter: bpy.props.IntProperty(name="iter", description="the iteration number for numerical methods", default=100, min=1)
    tol: bpy.props.FloatProperty(name="tol", description="the machine epsilon for numerical methods", default=1E-15, min=0)

    def execute(self, context):
        from blendocapsid.modules.democapsid.democapsid import (calc_ckm,
                                                                calc_ico,
                                                                calc_lattice)

        m, a, s = self.m, int(self.a), self.s
        ckp = (self.h, self.k, self.H, self.K)
        lat = calc_lattice(self.t, self.R)

        if m == "ico":
            meshes = calc_ico(ckp, lat, a=a, s=s, iter=self.iter, tol=self.tol)
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
    self.layout.separator()
    self.layout.operator(CapsidMesh.bl_idname, text="Capsid", icon="MESH_ICOSPHERE")


def register():
    bpy.utils.register_class(CapsidMesh)
    bpy.types.VIEW3D_MT_mesh_add.append(menu_func)


def unregister():
    bpy.utils.unregister_class(CapsidMesh)
