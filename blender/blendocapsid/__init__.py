bl_info = {
    'name': 'blendocapsid',
    'author': 'Daniel Antonio Negrón',
    'version': (0, 0, 1),
    'blender': (3, 0, 0),
    'location': 'Objects > Add Capsid Mesh',
    'description': 'Calculate meshes for icosahedral virus capsids with democapsid.',
    'warning': '',
    'wiki_url': 'https://github.com/dnanto/democapsid',
    'support': 'COMMUNITY',
    'category': 'Add Mesh'
}

__version__ = '.'.join(map(str, bl_info['version']))


# Handle Reload Scripts

if 'reload' in locals():
    import importlib as il
    il.reload(reload)
    reload.all()

import blendocapsid.reload as reload


def register():
    from . import patch
    patch.add_local_modules_to_path()

    from blendocapsid import operators, panels

    operators.register()
    panels.register()


def unregister():
    from blendocapsid import operators, panels

    operators.unregister()
    panels.unregister()


if __name__ == '__main__':
    register()
