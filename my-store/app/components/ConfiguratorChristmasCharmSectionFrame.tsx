import type { ReactNode } from "react"

type Props = {
  children: ReactNode
}

export function ConfiguratorChristmasCharmSectionFrame({ children }: Props) {
  return (
    <div className="christmas-charm-frame-wrap w-full">
      <div className="christmas-charm-frame">
        <div className="christmas-charm-frame__bow-layer" aria-hidden>
          <img
            src="/konfigurator/christmas-bow.png"
            alt=""
            width={1024}
            height={921}
            decoding="async"
            className="christmas-charm-frame__bow"
          />
        </div>
        <div className="christmas-charm-frame__body">{children}</div>
      </div>
    </div>
  )
}
