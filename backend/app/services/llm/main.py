"""
LLM Pipeline - Main Entry Point

运行示例：使用 Mock 数据测试完整流程
"""
import asyncio
import os
import json
from datetime import datetime

from loguru import logger

# 配置日志
logger.add(
    "logs/llm_pipeline_{time}.log",
    rotation="10 MB",
    retention="7 days",
    level="DEBUG",
)


async def main():
    """主函数：演示完整的 ETL 流程"""
    
    # ==================== 1. 环境检查 ====================
    print("\n" + "=" * 60)
    print("🚀 LiteTravel LLM Pipeline Demo")
    print("=" * 60)
    
    # 检查 API Key
    api_key = os.environ.get("VOLCENGINE_API_KEY")
    if not api_key:
        print("\n⚠️  VOLCENGINE_API_KEY 未设置!")
        print("请在 .env 文件中设置 VOLCENGINE_API_KEY")
        print("示例: VOLCENGINE_API_KEY=your-api-key-here")
        print("\n将使用 Mock 模式运行（不调用实际 LLM）...\n")
        use_mock_llm = True
    else:
        print(f"\n✅ API Key 已配置: {api_key[:8]}...{api_key[-4:]}")
        use_mock_llm = False
    
    # ==================== 2. 初始化 Pipeline ====================
    from . import (
        Pipeline,
        MockDataSource,
        XiaohongshuDataSource,
        VolcengineProvider,
        DataSourceType,
    )
    
    # 创建 Pipeline
    if use_mock_llm:
        # Mock 模式：不实际调用 LLM
        pipeline = Pipeline(concurrency=2)
        print("📦 Pipeline 初始化完成 (Mock LLM 模式)")
    else:
        # 真实模式：调用火山引擎
        llm = VolcengineProvider()
        pipeline = Pipeline(llm_provider=llm, concurrency=3)
        print(f"📦 Pipeline 初始化完成 (LLM: {llm.get_config().model})")
    
    # 注册数据源
    pipeline.register_data_source(MockDataSource())
    print("✅ 已注册数据源: MockDataSource")
    
    # 尝试注册小红书数据源
    try:
        pipeline.register_data_source(XiaohongshuDataSource())
        print("✅ 已注册数据源: XiaohongshuDataSource")
    except Exception as e:
        print(f"⚠️  小红书数据源未就绪: {e}")
    
    # ==================== 3. 获取 Mock 数据 ====================
    print("\n" + "-" * 60)
    print("📥 Step 1: 获取测试数据")
    print("-" * 60)
    
    mock_source = MockDataSource()
    notes = await mock_source.fetch_notes(keyword="长沙旅游", limit=3)
    
    print(f"获取到 {len(notes)} 条笔记:")
    for note in notes:
        print(f"  - [{note.id}] {note.title[:30]}...")
    
    # ==================== 4. 处理单条数据 ====================
    print("\n" + "-" * 60)
    print("🔄 Step 2: 处理单条笔记")
    print("-" * 60)
    
    if not use_mock_llm:
        # 实际调用 LLM
        result = await pipeline.process_note(notes[0])
        
        print(f"\n📊 分析结果:")
        print(f"  笔记ID: {result.note_id}")
        print(f"  情感倾向: {result.sentiment} ({result.sentiment_score}分)")
        print(f"  用户意图: {result.user_intent}")
        print(f"  关键词: {', '.join(result.keywords)}")
        print(f"  摘要: {result.summary}")
        print(f"  处理耗时: {result.processing_time:.2f}秒")
        
        if result.error:
            print(f"  ⚠️ 错误: {result.error}")
    else:
        print("(Mock 模式跳过实际 LLM 调用)")
    
    # ==================== 5. 批量处理 ====================
    print("\n" + "-" * 60)
    print("📦 Step 3: 批量处理")
    print("-" * 60)
    
    if not use_mock_llm:
        batch_result = await pipeline.process_batch(notes)
        
        print(f"\n📊 批量处理结果:")
        print(f"  总数: {batch_result.total_count}")
        print(f"  成功: {batch_result.success_count}")
        print(f"  失败: {batch_result.failed_count}")
        print(f"  总耗时: {batch_result.processing_time:.2f}秒")
        
        # 输出详细结果
        print("\n详细结果:")
        for r in batch_result.results:
            sentiment_emoji = {
                "positive": "😊",
                "negative": "😞",
                "neutral": "😐",
                "mixed": "🤔",
            }.get(r.sentiment.value, "❓")
            
            print(f"  {sentiment_emoji} [{r.note_id}] {r.sentiment.value} | {r.user_intent.value}")
    else:
        print("(Mock 模式跳过批量处理)")
    
    # ==================== 6. 输出 JSON ====================
    print("\n" + "-" * 60)
    print("💾 Step 4: JSON 输出示例")
    print("-" * 60)
    
    if not use_mock_llm and batch_result.results:
        sample_json = batch_result.results[0].model_dump_json(indent=2)
        print(sample_json)
    else:
        # Mock JSON 输出
        mock_result = {
            "note_id": "mock_001",
            "source": "mock",
            "sentiment": "positive",
            "sentiment_score": 4.5,
            "keywords": ["长沙旅游", "橘子洲", "茶颜悦色"],
            "summary": "长沙三天两夜攻略，涵盖橘子洲、岳麓山等经典景点，推荐茶颜悦色和黑色经典臭豆腐。",
            "user_intent": "recommend",
            "places": ["橘子洲头", "岳麓山", "太平老街", "文和友"],
            "tips": ["臭豆腐要吃黑色经典", "茶颜推荐幽兰拿铁", "夏天注意防晒"],
            "quality_score": 4.0,
            "is_ad": False,
        }
        print(json.dumps(mock_result, ensure_ascii=False, indent=2))
    
    print("\n" + "=" * 60)
    print("✅ Pipeline Demo 完成!")
    print("=" * 60)


async def demo_with_real_data():
    """使用小红书真实数据的演示"""
    from . import Pipeline, XiaohongshuDataSource, DataSourceType
    
    pipeline = Pipeline(concurrency=2)
    
    try:
        pipeline.register_data_source(XiaohongshuDataSource())
    except Exception as e:
        print(f"无法加载小红书数据源: {e}")
        return
    
    # 从小红书获取并处理数据
    result = await pipeline.fetch_and_process(
        source_type=DataSourceType.XIAOHONGSHU,
        keyword="长沙美食",
        city="长沙",
        limit=5,
    )
    
    print(f"处理完成: {result.success_count}/{result.total_count} 成功")
    
    for r in result.results:
        if not r.error:
            print(f"- {r.sentiment}: {r.summary[:50]}...")


if __name__ == "__main__":
    # 加载环境变量
    from dotenv import load_dotenv
    load_dotenv()
    
    # 运行主函数
    asyncio.run(main())
