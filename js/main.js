window.onload = function (opt) {
    const papers = [0, 1, 2].map((e) => {
        const scope = new paper.PaperScope();
        scope.setup(document.getElementById(`view${e}`));
        return scope;
    });
    ft_input(papers[0], papers[1]);
    document.getElementById("download-btn").addEventListener("click", function () {
        var link = document.createElement("a");
        link.href = URL.createObjectURL(
            new Blob(
                //
                [papers[1].project.exportSVG({ asString: true })],
                { type: "image/svg+xml;charset=utf-8" },
            ),
        );
        link.download = "my-paperjs-project.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    });
};
