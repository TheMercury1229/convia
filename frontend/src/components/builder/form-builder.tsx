"use client";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ComponentPalette } from "./component-palette";
import { FormCanvas } from "./form-canvas";
import { PropertiesInspector } from "./properties-inspector";

/**
 * Root form builder workspace.
 * Renders the resizable three-panel layout below the BuilderHeader:
 *   [ComponentPalette] <Handle> [FormCanvas] <Handle> [PropertiesInspector]
 *
 * Wraps everything in React DnD's HTML5Backend provider.
 * Both side panels have minimum and maximum width constraints, allowing users
 * to drag and customize their workspace without breaking the layout.
 */
export function FormBuilder() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-1 overflow-hidden h-full w-full">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full w-full"
        >
          {/* LEFT — Component Palette */}
          <ResizablePanel
            id="palette-panel"
            defaultSize="16%"
            minSize="12%"
            maxSize="24%"
            className="min-w-0 flex flex-col overflow-hidden"
          >
            <ComponentPalette />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* CENTER — Scrollable Form Canvas */}
          <ResizablePanel
            id="canvas-panel"
            defaultSize="64%"
            minSize="40%"
            className="min-w-0 flex flex-col overflow-hidden bg-muted/30"
          >
            <main className="flex-1 overflow-hidden h-full">
              <FormCanvas />
            </main>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* RIGHT — Properties Inspector */}
          <ResizablePanel
            id="inspector-panel"
            defaultSize="20%"
            minSize="16%"
            maxSize="32%"
            className="min-w-0 flex flex-col overflow-hidden"
          >
            <PropertiesInspector />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DndProvider>
  );
}
