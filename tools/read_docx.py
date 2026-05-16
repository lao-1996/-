#!/usr/bin/env python
# -*- coding: utf-8 -*-
import zipfile
import xml.etree.ElementTree as ET
import os

def read_docx(docx_path):
    """读取docx文件中的文本内容"""
    try:
        # 打开docx文件（它是一个zip压缩包）
        with zipfile.ZipFile(docx_path, 'r') as docx:
            # 读取document.xml文件
            xml_content = docx.read('word/document.xml')
            
        # 解析XML
        tree = ET.fromstring(xml_content)
        
        # 定义命名空间
        namespaces = {
            'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
        }
        
        # 提取所有文本
        texts = []
        for elem in tree.iter():
            if elem.tag.endswith('}t'):  # 文本节点
                if elem.text:
                    texts.append(elem.text)
        
        return '\n'.join(texts)
    except Exception as e:
        return f"读取失败: {str(e)}"

# 读取文档内容
docx_path = "C:\\Users\\劳润杰\\Desktop\\奔赴心意·躲避闯关游戏文字脚本.docx"
content = read_docx(docx_path)

print("=== 文档内容 ===")
print(content)
print("\n=== 内容结束 ===")

# 将内容保存到文件
with open("game_script.txt", "w", encoding="utf-8") as f:
    f.write(content)
