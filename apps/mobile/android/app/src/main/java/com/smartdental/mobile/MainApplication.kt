package com.smartdental.mobile

import android.app.Application
import android.content.Context
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  /** Giới hạn cỡ chữ hệ thống ngay từ context của ứng dụng (React Native đọc thông số hiển thị tại đây) */
  override fun attachBaseContext(base: Context) {
    super.attachBaseContext(FontScaleLimiter.wrap(base))
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
