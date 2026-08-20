figma.showUI(__html__, { visible: false });

figma.ui.onmessage = async (msg) => {
    try {
        let result;

        if (msg.type === "createPage") {
            const page = figma.createPage();
            page.name = msg.name || "Nova Página";
            result = { id: page.id, name: page.name };
        }

        else if (msg.type === "createFrame") {
            await figma.setCurrentPageAsync(
                figma.root.children.find(p => p.id === msg.pageId) || figma.currentPage
            );
            const frame = figma.createFrame();
            frame.name = msg.name || "Frame";
            frame.resize(msg.width || 1440, msg.height || 900);
            frame.x = msg.x || 0;
            frame.y = msg.y || 0;
            if (msg.fillColor) {
                frame.fills = [{
                    type: "SOLID",
                    color: hexToRgb(msg.fillColor)
                }];
            }
            result = { id: frame.id, name: frame.name };
        }

        else if (msg.type === "createComponent") {
            await figma.setCurrentPageAsync(
                figma.root.children.find(p => p.id === msg.pageId) || figma.currentPage
            );
            const component = figma.createComponent();
            component.name = msg.name || "Componente";
            component.resize(msg.width || 200, msg.height || 200);
            component.x = msg.x || 0;
            component.y = msg.y || 0;
            result = { id: component.id, name: component.name };
        }

        else if (msg.type === "createVariable") {
            const collection = figma.variables.getLocalVariableCollections()
                .find(c => c.name === msg.collection);

            let col;
            if (collection) {
                col = collection;
            } else {
                col = figma.variables.createVariableCollection(msg.collection || "GPT Variables");
            }

            const variable = figma.variables.createVariable(
                msg.name,
                col.id,
                msg.resolvedType || "STRING"
            );

            const modeId = col.defaultModeId;
            variable.setValueForMode(modeId, msg.value ?? "");
            result = { id: variable.id, name: variable.name };
        }

        figma.ui.postMessage({ success: true, result, commandId: msg.commandId });

    } catch (err) {
        figma.ui.postMessage({ success: false, error: err.message, commandId: msg.commandId });
    }
};

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
}