package com.smartdental.mobile

import android.content.Context
import android.content.res.Configuration

/**
 * Giới hạn mức phóng to chữ của hệ thống (Cài đặt > Hiển thị > Cỡ chữ).
 *
 * Vẫn cho chữ to hơn bình thường để hỗ trợ người cần (tối đa 1.3x), nhưng không để chữ
 * phình tới 2x khiến nút bấm, thẻ và bảng thông tin bị vỡ hoặc che lẫn nhau.
 */
object FontScaleLimiter {
  const val MAX_FONT_SCALE = 1.3f

  fun wrap(base: Context): Context {
    val current = base.resources.configuration
    if (current.fontScale <= MAX_FONT_SCALE) return base

    val limited = Configuration(current).apply { fontScale = MAX_FONT_SCALE }
    return base.createConfigurationContext(limited)
  }
}
