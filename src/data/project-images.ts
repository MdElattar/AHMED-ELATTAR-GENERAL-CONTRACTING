import type { ArtVariant } from "@/data/projects";
import { projectPhotos } from "@/data/media";

/**
 * Canonical project photography.
 *
 * The public portfolio already ships real photography for every project art
 * direction. These defaults reuse those exact URLs instead of re-uploading
 * duplicates, while still exposing the additive image fields (`coverUrl`,
 * `thumbUrl`, `blurDataURL`, `gallery`) that the admin media pipeline writes
 * to for project-specific uploads.
 */
export type ProjectImageDefaults = {
  coverUrl: string;
  thumbUrl: string;
  blurDataURL: string;
  gallery: string[];
  artGallery: ArtVariant[];
};

const blurDataURLs: Record<ArtVariant, string> = {
  tower:
    "data:image/webp;base64,UklGRo4AAABXRUJQVlA4IIIAAADQAwCdASoUAA4APwFqrE8rJiQiMAgBYCAJYwCdAA2mLPtedLdbqoAA/rYXwoJkBuw3kLzpc9OI5HBk2VpnjReah5MdCcb+5gSFr988GvWgVgb8ITJ69HGTWOcyL8DSZwvO04UaLpgfM8WlPiZmN1GIqonWz/MXC2WJgqo1I1ApAAAA",
  villa:
    "data:image/webp;base64,UklGRpQAAABXRUJQVlA4IIgAAABwBACdASoUAA4APwFqrE6rJiQiMAgBYCAJZgCdIEy4ABSIXVgyR2+p3Mq4AAD97pC/f3WaStGsah7kFsb3sWTjjsu/1ZZgxxovSG31WFBbohRp8rsP1xBhrXrMrgmyj9PsgDxUCbovYeWfXCJ134v5eAQeUcMx8DoNfxMuR64S0PyXx4TjgAAA",
  bridge:
    "data:image/webp;base64,UklGRpQAAABXRUJQVlA4IIgAAABwBACdASoUAA4APwForE6rJiQiMAgBYCAJZACdMoADgzlJ8C+t4qaIMo1RcAD6nc99hs/Y29EwoniWh5DL8ciW8Lzz1bN2hyzUNUXiYKQgFOxsGXATUX0rrnhCBcO2v61BAu/j3ihrAwew4spaxEux/ngLyxvxk7QuQZoQCWDVUKbNHRqD9AAA",
  industrial:
    "data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAABQBACdASoUAA4APwFqrE8rJiQiMAgBYCAJYwC7Ef/gNZ/4kw5RKurTldIAAP7XOg5bB60BjE02iL1LtwDrxDZx9umDrPHmv95IBTl8oMMKobfNJOzRIz9VDlSZD+TTwokkpsAT+yykwF1S6x7UB8566ByHkkNRDXtb28AA",
  heritage:
    "data:image/webp;base64,UklGRn4AAABXRUJQVlA4IHIAAAAQBACdASoUAA4APwForE6rJaQiMAgBYCAJZwC7ACLHYRGnjQuxtBnYEAD8Y/ZXoOKM+9tuYq5c2g3hU//psWkWRYdD2Y/rWLruFW4422A33dwdL32zaormBrGLSitsVjeDiMJQrC1vzTtaQzWyEaaAAAA=",
  interchange:
    "data:image/webp;base64,UklGRnwAAABXRUJQVlA4IHAAAAAwBACdASoUAA4APwFqrU8rJaQiMAgBYCAJYwCdMoADS+iqzYYwjeE542AA/rIyLBJfx4fJdtKILLihJmM7oC8Nd6hhepnTZAoidrWWxR2Wc5kmtt3zdA5t2xc7Nhq+1owu5xxvH1smSWMGF8BcSqgA",
  marina:
    "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAAAwBACdASoUAA4APwFqrE8rJiQiMAgBYCAJYwCdABxMvCLU8MxcCrgxUcAA/uNFHYxkaRgdvwRS+tO/nKr2i38B7d0+XIXriH8Bkmq8ll85sNuXLIkhAAAA",
  solar:
    "data:image/webp;base64,UklGRnoAAABXRUJQVlA4IG4AAACwAwCdASoUAA4APwForE6rJaQiMAgBYCAJQBOgA25QF8D/oqL9IAD+vDs3t5HXKaPv8NeiBg+kTaiekRdSv2apRGbE7WShESmSwq96aIWQgYaoebjDu/tkEeZIfZZG695CgP0CkxbdcirKSkqgAA==",
};

export const projectImageDefaults: Record<ArtVariant, ProjectImageDefaults> = Object.fromEntries(
  (Object.keys(projectPhotos) as ArtVariant[]).map((art) => {
    const coverUrl = projectPhotos[art].src;
    return [
      art,
      {
        coverUrl,
        thumbUrl: coverUrl.replace(/([?&])w=\d+/, "$1w=800"),
        blurDataURL: blurDataURLs[art],
        gallery: [coverUrl],
        artGallery: [art],
      },
    ];
  }),
) as Record<ArtVariant, ProjectImageDefaults>;
