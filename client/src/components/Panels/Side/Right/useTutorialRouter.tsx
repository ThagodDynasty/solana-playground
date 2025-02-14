import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAtom } from "jotai";

import { Route } from "../../../../constants";
import { explorerAtom, refreshExplorerAtom } from "../../../../state";
import {
  PgExplorer,
  PgRouter,
  PgShare,
  PgTutorial,
  PgView,
} from "../../../../utils/pg";
import { Sidebar } from "../sidebar-state";

export const useSetupExplorerAndRouter = () => {
  const [explorer, setExplorer] = useAtom(explorerAtom);
  const [, refreshExplorer] = useAtom(refreshExplorerAtom);

  const [loading, setLoading] = useState(true);

  const { pathname } = useLocation();

  // Initialize explorer
  useEffect(() => {
    if (
      pathname === Route.DEFAULT ||
      pathname.startsWith(Route.TUTORIALS) ||
      pathname.startsWith(Route.GITHUB)
    ) {
      if (explorer && !explorer.isShared) return;
      (async () => {
        try {
          const _explorer = new PgExplorer(refreshExplorer);
          await _explorer.init();

          // If it's github, import the project
          if (pathname.startsWith(Route.GITHUB)) {
            await _explorer.importFromGithub(
              pathname.split(`${Route.GITHUB}/`)?.[1]
            );
            // Navigate to main(will re-run current function)
            PgRouter.navigate(Route.DEFAULT);
            return;
          }
          // If it's a tutorial, navigate to the tutorial's path
          else if (
            pathname === Route.DEFAULT &&
            PgTutorial.isWorkspaceTutorial(_explorer.currentWorkspaceName!)
          ) {
            PgTutorial.open(_explorer.currentWorkspaceName!);
          }

          setExplorer(_explorer);
        } catch (e: any) {
          console.log(e.message);
          PgRouter.navigate(Route.DEFAULT);
        }
      })();
    } else if (!explorer?.isShared) {
      // Shared project
      (async () => {
        try {
          const explorerData = await PgShare.get(pathname);
          setExplorer(new PgExplorer(refreshExplorer, explorerData));
        } catch {
          // Couldn't get the data
          // Redirect to main
          PgRouter.navigate(Route.DEFAULT);
        }
      })();
    }
  }, [explorer, pathname, setExplorer, refreshExplorer]);

  // Handle workspace change/deletion
  useEffect(() => {
    if (!explorer) return;

    const initWorkspace = explorer.onDidChangeWorkspace(() => {
      if (!explorer.currentWorkspaceName) return;

      // If it's a tutorial, navigate to the tutorial's path
      if (PgTutorial.isWorkspaceTutorial(explorer.currentWorkspaceName)) {
        PgTutorial.open(explorer.currentWorkspaceName);
      } else {
        PgRouter.navigate(Route.DEFAULT);
      }
    });

    const deleteWorkspace = explorer.onDidDeleteWorkspace(() => {
      // Set view to the default editor if there are workspaces
      if (!explorer.hasWorkspaces()) PgView.setMain();
    });

    return () => {
      initWorkspace.dispose();
      deleteWorkspace.dispose();
    };
  }, [explorer]);

  // Handle sidebar state change
  useEffect(() => {
    PgView.onDidChangeSidebarState(async (sidebarState) => {
      const pathname = await PgRouter.getPathname();
      if (
        sidebarState === Sidebar.TUTORIALS &&
        !pathname.startsWith(Route.TUTORIALS)
      ) {
        PgRouter.navigate(Route.TUTORIALS);
      } else if (
        sidebarState !== Sidebar.TUTORIALS &&
        (pathname === Route.TUTORIALS ||
          !(await PgTutorial.isCurrentWorkspaceTutorial()))
      ) {
        PgRouter.navigate(Route.DEFAULT);
      }
    });
  }, []);

  useEffect(() => {
    if (explorer) setLoading(false);
  }, [explorer]);

  return { loading };
};
