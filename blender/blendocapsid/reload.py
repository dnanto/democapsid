import blendocapsid


def all():
    import importlib as il

    # Reload package
    il.reload(blendocapsid)

    # Reload operators subpackage
    il.reload(blendocapsid.operators)

    # Reload panels subpackage
    il.reload(blendocapsid.panels)

    print('blendocapsid: Reload finished.')
