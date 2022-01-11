---
title: 'Vectorized Capsid Rendering in the Browser with Capsid.js'
tags:
  - virus
  - capsid
  - caspar-klug
  - icosahedron
  - hexamer
  - pentamer
  - rendering
  - javascript
  - svg
  - net
  - 2D
  - 3D
authors:
  - name: Daniel Antonio Negrón
    orcid: 0000-0002-6123-2441
    affiliation: 1
affiliations:
 - name: George Mason University, Bioinformatics and Computational Biology, 10900 University Blvd, Manassas, VA, 20110
   index: 1
citation_author: Negrón
date: 11 January 2022
year: 2022
bibliography: paper.bib
output: rticles::joss_article
csl: apa.csl
journal: JOSS
---

# Summary

Online viral resources lack high-quality capsid models for designing infographics and scientific figures. Accordingly, the capsid.js library implements Caspar-Klug theory to generate SVG files compatible with office and design software. The corresponding online application parameterizes style options, perspectives, and specialized lattice patterns. This project is actively developed on GitHub (https://github.com/dnanto/capsid), distributed under the MIT License, and hosted on GitHub Pages (https://dnanto.github.io/capsid/capsid.html). Supplementary data are available on GitHub.


# Statement of need

Molecular biology is the study of the building blocks of life and how they organize into complex objects via intricate processes and cycles. Researchers, professors, and authors in the field often condense complicated concepts into simplified diagrams and cartoons for effective communication. Such representations are useful for describing viral capsid structure, assembly, and interactions. 

The ViralZone web resource takes a direct approach, providing a static reference diagram for each known virus [@huloViralZoneKnowledgeResource2011]. This contrasts with dynamic computational resources such as VIPER, which assembles realistic capsid structures from PDB files [@reddyVirusParticleExplorer2001]. VIPERdb hosts the Icosahedral Server, but it only exports three-dimensional files in the same specialized format [@carrillo-trippVIPERdb2EnhancedWeb2009]. Neither resource provides an interactive online method for generating simple, two and three-dimensional structure files that are compatible with office or vector graphics software for editing.

To solve this problem, the capsid.js project provides an interactive tool that renders icosahedral capsids and their nets in the browser. It parameterizes styling, projections, and lattice geometries and exports resulting models to SVG, since they are publication-quality, infinitely scalable, and compatible with word processors and vector graphics editors. This also means that the user is free to remix the SVG shape components.


# Methods

The application consists of an object-oriented JavaScript library that implements Caspar-Klug theory to generate and project the faces of the unit icosahedron [@casparPhysicalPrinciplesConstruction1962]. It also includes the Paper.js library for 2D vector graphics methods [@lehniPaperjsPaperJs2020]. A simple linear algebra engine provides methods to compute a camera matrix and project points. Figure 1 combines output from the program to describe the construction process.

![Construct the face and icosahedron for a levo T7 viral capsid ($T=h^2+hk+k^2=2^2+(2)(1)+1^2$). This figure shows how office software such as Microsoft PowerPoint can import and convert the SVG files generated with capsid.js into shape objects. (A) Select the unit tile (hexagon) and draw a grid. Draw a triangle over the grid, moving $h$ and $k$ tile units forwards and left respectively. (B) Extract the triangular area from the grid. Color the hexamers and pentamers based on the unit tile circumradius from each face vertex. (C) Project the face to the 2D coordinates of the icosahedron based on the camera matrix. (D) Alternate tiling patterns. (E) The icosahedral net.](figure.pdf "Figure 1")

## Face

The first rendering step generates a grid of the selected tile geometry, including hexagonal, trihexagonal, snub hexagonal, rhombitrihexagonal, or the dual projection of any of the former. These additional tiles account for viruses with specialized lattice architectures [@twarockStructuralPuzzlesVirology2019]. Next, the procedure draws an equilateral triangle based on the $h$ and $k$ parameters, moving $h$ tile units forward and $k$ to the left or right depending on the selected levo or dextro parameter. This walk generates a triangle that serves as a cookie-cutter for removing the portion of the grid that serves as the face.

## Color

The application includes color options for the hexamer, pentamer, fiber, and fiber knob domain. Additional colors correspond to the selected tiling. Disambiguation between hexamer and pentamer depends on whether the tile occurs at a vertex based on the grid walk.

## Projection

To project each face, the procedure computes the unit icosahedron and applies the camera matrix to each vertex. Sorting each face by the z-coordinates achieves realistic occlusion. An affine transform operation then translates each face to the corresponding 2D projection coordinates of each face on the solid. To render vertex proteins, such as the adenovirus fiber, the procedure computes the vertexes of a larger icosahedron and includes the corresponding objects in the z-ordering operation.

## Discussion

The capsid.js app renders customizable icosahedral viral capsids and was recently used to model the adeno-associated virus (AAV) [@hamannImprovedTargetingHuman2021]. Development is active with plans to include elongated (prolate/oblate) capsids. A separate prototype for generating elongated capsid nets is available based on theory [@moodyShapeTevenBacteriophage1965; @luqueStructureElongatedViral2010]. High-resolution SVG continues being a primary design goal to aid in the creation of detailed figures. This includes rendering all details as separate shapes. As a result, the current implementation may lag for large values of $h$ or $k$. However, performance enhancements are possible by improving the rendering algorithm or switching to a GPU-based library, such as WebGL.


# Acknowledgements

The author would like the thank his dissertation committee: Dr. Donald Seto, Dr. Patrick Gillevet, and Dr. Sterling Thomas. Also, the author would like to thank Shane Mitchell, Mychal Ivancich, and Mitchell Holland for comments and review. This constitutes a portion (Chapter 2) of the PhD dissertation "Molecular Clock Analysis of Human Adenovirus" submitted to GMU.


# References
