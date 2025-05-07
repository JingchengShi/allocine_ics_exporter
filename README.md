# allocine_ics_exporter / allocine_ics_生成插件
Get film information from allociné and generate .ics file.

### 功能:

在 https://mon.allocine.fr/mes-cinemas/ 页面生成对应电影场次的 .ics 日历文件，方便添加到所有日历。

### 用法：

1. 下载压缩包
2. 将 allocine-ics-v*.* 文件夹解压缩
3. 把文件夹拖拽到 chrome 浏览器 chrome://extensions/ （或edge浏览器）
4. 启用

### 注意⚠️：

- **插件的运行需要在原网页，网页翻译功能会让导出出错！下载.ics文件时请确保关闭网页翻译功能。**

### v1.0 更新：

- .ics文件名：电影名_放映时间_放映日期.ics
- 日历文件下载前会做一次确认，如果文件时间信息不完整，会在文件名前显示 Error
- 添加了 `TZID=Europe/Paris` 到 `DTSTART` 和 `DTEND` 字段。主流日历会自动识别巴黎时间，包括夏令时切换。
- 日历事件时长从Allociné电影详情页获取，如果获取失败，默认时长为120分钟。

![image](https://github.com/user-attachments/assets/5a3b2dad-490d-4546-824c-2523b2237c23)
