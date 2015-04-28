from flask import Response, render_template, send_from_directory

from ..util import static_file_path


def configure(bp):

    @bp.route("/gadget/")
    def form_builder():
        return render_template("gadget.html")

    @bp.route("/gadget/style.css")
    def style():
        return Response(concat_css(), mimetype="text/css")

    @bp.route("/gadget/application.js")
    def application():
        return Response(concat_js(), mimetype="application/javascript")

    @bp.route("/gadget/loader.js")
    def themes(path):
        return Response(concat_loader(), mimetype="application/javascript")

    return bp

js_cache = None
css_cache = None

def concat_css():
    global css_cache
    css_cache = None
    if css_cache is None:
        css_cache = "".join([
            open(static_file_path("lib/oojs-ui/oojs-ui-mediawiki.css")).read(),
            open(static_file_path("lib/codemirror/codemirror.css")).read(),
            open(static_file_path("css/form_builder.css")).read(),
            open(static_file_path("css/wikilabels.css")).read()
        ])

    return css_cache

def concat_js():
    global js_cache
    js_cache = None
    if js_cache is None:
        js_cache = "".join([
            open(static_file_path("js/wikilabels.gadget.js")).read(),
        ])

    return js_cache
