import { container } from "tsyringe";
import { UpdateHandler } from "./update-handler";
import { Arch, Platform } from "@elevate/shared/enums";
import { AutoUpdateNotify, GhAsset, GhRelease, StaticUpdateNotify } from "@elevate/shared/models";

describe("UpdateHandler", () => {
  let updateHandler: UpdateHandler;

  beforeEach(done => {
    updateHandler = container.resolve(UpdateHandler);
    done();
  });

  describe("Get github release by platform", () => {
    it("should get all MacOS ARM64 releases (allow pre-release)", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.ARM64;

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-arm64.dmg`
            }
          ] as GhAsset[]
        },
        {
          tag_name: "7.1.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.exe`
            }
            // {
            //   browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0-arm64.dmg`
            // }
          ] as GhAsset[]
        },
        {
          tag_name: "7.0.0",
          prerelease: true,
          assets: [
            {
              browser_download_url: `https://url.com/7.0.0/Elevate-7.0.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.0.0/Elevate-7.0.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.0.0/Elevate-7.0.0-arm64.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.getReleasesByPlatform(platform, arch, true);

      // Then
      promise.then((platformReleases: GhRelease[]) => {
        expect(platformReleases.length).toEqual(2);
        expect(platformReleases[0].tag_name).toEqual("7.2.0");
        expect(platformReleases[1].tag_name).toEqual("7.0.0");
        done();
      });
    });

    it("should get all MacOS ARM64 releases (disallow pre-release)", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.ARM64;

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-arm64.dmg`
            }
          ] as GhAsset[]
        },
        {
          tag_name: "7.1.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.exe`
            }
            // {
            //   browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0-arm64.dmg`
            // }
          ] as GhAsset[]
        },
        {
          tag_name: "7.0.0",
          prerelease: true,
          assets: [
            {
              browser_download_url: `https://url.com/7.0.0/Elevate-7.0.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.0.0/Elevate-7.0.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.0.0/Elevate-7.0.0-arm64.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.getReleasesByPlatform(platform, arch, false);

      // Then
      promise.then((platformReleases: GhRelease[]) => {
        expect(platformReleases.length).toEqual(1);
        expect(platformReleases[0].tag_name).toEqual("7.2.0");
        done();
      });
    });
  });

  describe("Check update for a given target (platform + arch)", () => {
    it("should detect MacOS ARM64 update inside multiple releases", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.ARM64;

      const clientVersion = "7.1.0";

      const expectedAsset = {
        size: 30000,
        browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-arm64.dmg`
      };
      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.dmg`
            },
            expectedAsset
          ] as GhAsset[]
        },
        {
          tag_name: "7.1.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0-arm64.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify.size).toEqual(expectedAsset.size);
        expect(updateNotify.downloadUrl).toEqual(expectedAsset.browser_download_url);
        expect(updateNotify.isAutoUpdatable).toBeFalsy();
        done();
      });
    });

    it("should detect MacOS X64 update (with MacOS ARM64 also present)", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.X64;
      const clientVersion = "7.1.0";

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-arm64.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify.downloadUrl).toMatch("Elevate-7.2.0.dmg");

        done();
      });
    });

    it("should detect MacOS ARM64 update (with MacOS X64 also present)", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.ARM64;
      const clientVersion = "7.1.0";

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-arm64.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify.downloadUrl).toMatch("Elevate-7.2.0-arm64.dmg");
        done();
      });
    });

    it("should detect Linux Deb update", done => {
      // Given
      const platform = Platform.LINUX;
      const arch = Arch.X64;
      const clientVersion = "7.1.0";

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-universal.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify.downloadUrl).toMatch("Elevate-7.2.0.deb");
        expect(updateNotify.isAutoUpdatable).toBeFalsy();
        done();
      });
    });

    it("should detect Windows auto-updatable update", done => {
      // Given
      const platform = Platform.WINDOWS;
      const arch = Arch.X64;
      const clientVersion = "7.1.0";

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.exe`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-universal.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: AutoUpdateNotify) => {
        expect(updateNotify.isAutoUpdatable).toBeTruthy();
        done();
      });
    });

    it("should detect MacOS X64 update (with universal release)", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.X64;
      const clientVersion = "7.1.0";

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-universal.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify.downloadUrl).toMatch("Elevate-7.2.0-universal.dmg");

        done();
      });
    });

    it("should detect MacOS ARM64 update (with universal release)", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.ARM64;
      const clientVersion = "7.1.0";

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-universal.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify.downloadUrl).toMatch("Elevate-7.2.0-universal.dmg");

        done();
      });
    });

    it("should not detect update: client already up to date", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.ARM64;
      const clientVersion = "7.2.0";

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-arm64.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify).toBeNull();
        done();
      });
    });

    it("should not detect update: client arch not available", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.X64;
      const clientVersion = "7.1.0";

      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.exe`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify).toBeNull();
        done();
      });
    });

    it("should get an intermediate update: a new update is available but not the latest one (client platform or target not available)", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.ARM64;

      const clientVersion = "7.0.0";

      const expectedAsset = {
        size: 11111,
        browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0-arm64.dmg`
      };
      const releases: Partial<GhRelease>[] = [
        {
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.dmg`
            }
            // Missing ARM64 DMG https://url.com/7.2.0/Elevate-7.2.0-arm64.dmg
          ] as GhAsset[]
        },
        {
          tag_name: "7.1.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.dmg`
            },
            expectedAsset
          ] as GhAsset[]
        },
        {
          tag_name: "7.0.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.0.0/Elevate-7.0.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.0.0/Elevate-7.0.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.0.0/Elevate-7.0.0-arm64.dmg`
            }
          ] as GhAsset[]
        }
      ];

      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify.size).toEqual(expectedAsset.size);
        expect(updateNotify.downloadUrl).toEqual(expectedAsset.browser_download_url);
        done();
      });
    });

    it("should skip draft releases", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.ARM64;

      const clientVersion = "7.1.0";

      const releases: Partial<GhRelease>[] = [
        {
          draft: true,
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-arm64.dmg`
            }
          ] as GhAsset[]
        },
        {
          tag_name: "7.1.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0-arm64.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify).toBeNull();
        done();
      });
    });

    it("should skip a pre release update", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.ARM64;

      const clientVersion = "7.1.0";

      const releases: Partial<GhRelease>[] = [
        {
          prerelease: true,
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-arm64.dmg`
            }
          ] as GhAsset[]
        },
        {
          tag_name: "7.1.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0-arm64.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, false);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify).toBeNull();
        done();
      });
    });

    it("should accept and detect a pre release update", done => {
      // Given
      const platform = Platform.MACOS;
      const arch = Arch.ARM64;
      const clientVersion = "7.1.0";
      const acceptPreReleases = true;

      const expectedAsset = {
        size: 30000,
        browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0-arm64.dmg`
      };
      const releases: Partial<GhRelease>[] = [
        {
          prerelease: true,
          tag_name: "7.2.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.2.0/Elevate-7.2.0.dmg`
            },
            expectedAsset
          ] as GhAsset[]
        },
        {
          tag_name: "7.1.0",
          assets: [
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.deb`
            },
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0.dmg`
            },
            {
              browser_download_url: `https://url.com/7.1.0/Elevate-7.1.0-arm64.dmg`
            }
          ] as GhAsset[]
        }
      ];
      spyOn(updateHandler, "getReleases").and.returnValue(Promise.resolve(releases));

      // When
      const promise = updateHandler.manualUpdateCheck(clientVersion, platform, arch, acceptPreReleases);

      // Then
      promise.then((updateNotify: StaticUpdateNotify) => {
        expect(updateNotify.size).toEqual(expectedAsset.size);
        expect(updateNotify.downloadUrl).toEqual(expectedAsset.browser_download_url);
        done();
      });
    });
  });
});
