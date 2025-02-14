import { Sidebar } from "../../components/Panels/Side/sidebar-state";
import { EventName } from "../../constants";
import { PgCommon } from "./common";
import { PgDisposable } from "./types";

export class PgView {
  /**
   * Set main view.
   *
   * @param El element to set the main view to. If empty, default editor will be set.
   */
  static setMain(El?: () => JSX.Element) {
    PgCommon.createAndDispatchCustomEvent(EventName.VIEW_MAIN_SET, { El });
  }

  static setSidebarState(state: Sidebar) {
    PgCommon.createAndDispatchCustomEvent(
      EventName.VIEW_SIDEBAR_STATE_SET,
      state
    );
  }

  /**
   * Runs after changing sidebar state
   *
   * @param cb callback function to run after changing sidebar page
   * @returns a dispose function to clear the event
   */
  static onDidChangeSidebarState(cb: (state: Sidebar) => any): PgDisposable {
    const handle = (e: UIEvent & { detail: { state: Sidebar } }) => {
      cb(e.detail.state);
    };

    document.addEventListener(
      EventName.VIEW_ON_DID_CHANGE_SIDEBAR_STATE,
      handle as EventListener
    );
    return {
      dispose: () =>
        document.removeEventListener(
          EventName.VIEW_ON_DID_CHANGE_SIDEBAR_STATE,
          handle as EventListener
        ),
    };
  }
}
