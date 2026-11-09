import { Common, Renderer } from "@freelensapp/extensions";
import { observable } from "mobx";
import { observer } from "mobx-react";
import { useState } from "react";

const {
  Component: {
    KubeObjectListLayout,
    Icon,
    KubeObjectAge,
    MaybeLink,
    NamespaceSelectBadge,
    WithTooltip,
    TabLayout,
    ReactiveDuration,
  },
  Navigation: { getDetailsUrl },
  K8sApi: { eventStore, apiManager },
} = Renderer;

const {
  Util: { cssNames, stopPropagation },
} = Common;

function isKubeBlocksEvent(event: Renderer.K8sApi.KubeEvent): boolean {
  const apiVersion = event?.involvedObject?.apiVersion ?? "";
  return (
    apiVersion.includes("apps.kubeblocks.io/") ||
    apiVersion.includes("dataprotection.kubeblocks.io/") ||
    apiVersion.includes("extensions.kubeblocks.io/")
  );
}

enum columnId {
  message = "message",
  namespace = "namespace",
  object = "object",
  type = "type",
  count = "count",
  source = "source",
  age = "age",
  lastSeen = "last-seen",
}

const sortingCallbacks = {
  [columnId.namespace]: (event: Renderer.K8sApi.KubeEvent) => event.getNs(),
  [columnId.type]: (event: Renderer.K8sApi.KubeEvent) => event.type,
  [columnId.object]: (event: Renderer.K8sApi.KubeEvent) => event.involvedObject.name,
  [columnId.count]: (event: Renderer.K8sApi.KubeEvent) => event.count,
  [columnId.age]: (event: Renderer.K8sApi.KubeEvent) => -event.getCreationTimestamp(),
  [columnId.lastSeen]: (event: Renderer.K8sApi.KubeEvent) =>
    event.lastTimestamp ? -new Date(event.lastTimestamp).getTime() : 0,
};

type SortableColumn = keyof typeof sortingCallbacks;

export interface KubeBlocksEventsProps {
  className?: string;
  compact?: boolean;
  compactLimit?: number;
}

// A function component rather than an @observer class: under mobx-react 10 a class may read this.props only in
// render(), and the host calls getItems and customizeHeader from its own derivations.
export const KubeBlocksEvents = observer(
  ({ compact, compactLimit, className, ...layoutProps }: KubeBlocksEventsProps) => {
    const [sorting] = useState(() =>
      observable.object({
        sortBy: columnId.age as SortableColumn,
        orderBy: "asc" as "asc" | "desc",
      }),
    );

    const items = eventStore.contextItems.filter(isKubeBlocksEvent).sort((a, b) => {
      const valA = sortingCallbacks[sorting.sortBy](a) ?? "";
      const valB = sortingCallbacks[sorting.sortBy](b) ?? "";
      if (valA === valB) return 0;
      const compare = valA > valB ? 1 : -1;
      return sorting.orderBy === "asc" ? compare : -compare;
    });
    const visibleItems = compact ? items.slice(0, compactLimit) : items;

    const customizeHeader: Renderer.Component.HeaderCustomizer = ({ info, title, ...headerPlaceholders }) => {
      const allEventsAreShown = visibleItems.length === items.length;

      if (compact) {
        if (allEventsAreShown) {
          return { title };
        }
        return {
          title,
          info: (
            <span>
              {"("}
              {visibleItems.length}
              {" of "}
              {items.length}
              {")"}
            </span>
          ),
        };
      }

      return {
        info: (
          <>
            {info}
            <Icon small material="help_outline" className="help-icon" tooltip={`Limited to ${eventStore.limit}`} />
          </>
        ),
        title,
        ...headerPlaceholders,
      };
    };

    const events = (
      <KubeObjectListLayout
        {...layoutProps}
        isConfigurable
        tableId="kubeblocks-events"
        store={eventStore}
        className={cssNames("Events", className, { compact })}
        renderHeaderTitle="KubeBlocks Events"
        customizeHeader={customizeHeader}
        isSelectable={false}
        getItems={() => visibleItems}
        virtual={!compact}
        tableProps={{
          sortSyncWithUrl: false,
          sortByDefault: sorting,
          onSort: (params) => Object.assign(sorting, params),
        }}
        sortingCallbacks={sortingCallbacks}
        searchFilters={[
          (event) => event.getSearchFields(),
          (event) => event.message,
          (event) => event.getSource(),
          (event) => event.involvedObject.name,
        ]}
        renderTableHeader={[
          { title: "Type", className: "type", sortBy: columnId.type, id: columnId.type },
          { title: "Message", className: "message", id: columnId.message },
          { title: "Namespace", className: "namespace", sortBy: columnId.namespace, id: columnId.namespace },
          { title: "Involved Object", className: "object", sortBy: columnId.object, id: columnId.object },
          { title: "Source", className: "source", id: columnId.source },
          { title: "Count", className: "count", sortBy: columnId.count, id: columnId.count },
          { title: "Age", className: "age", sortBy: columnId.age, id: columnId.age },
          { title: "Last Seen", className: "last-seen", sortBy: columnId.lastSeen, id: columnId.lastSeen },
        ]}
        renderTableContents={(event) => {
          const { involvedObject, type, message } = event;
          const isWarning = event.isWarning();

          return [
            <WithTooltip>{type}</WithTooltip>,
            {
              className: cssNames({ warning: isWarning }),
              title: <WithTooltip>{message}</WithTooltip>,
            },
            <NamespaceSelectBadge key="namespace" namespace={event.getNs()} />,
            <MaybeLink
              key="link"
              to={getDetailsUrl(apiManager.lookupApiLink(involvedObject, event))}
              onClick={stopPropagation}
            >
              <WithTooltip>{`${involvedObject.kind}: ${involvedObject.name}`}</WithTooltip>
            </MaybeLink>,
            <WithTooltip>{event.getSource()}</WithTooltip>,
            event.count,
            <KubeObjectAge key="age" object={event} />,
            <WithTooltip tooltip={event.lastTimestamp ? new Date(event.lastTimestamp) : undefined}>
              <ReactiveDuration key="last-seen" timestamp={event.lastTimestamp} />
            </WithTooltip>,
          ];
        }}
      />
    );

    if (compact) {
      return events;
    }

    return <TabLayout>{events}</TabLayout>;
  },
);
