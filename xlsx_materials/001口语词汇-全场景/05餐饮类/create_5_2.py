import openpyxl
from openpyxl import Workbook

wb = Workbook()
ws = wb.active

# 30个用餐对话场景的口语词汇
vocab_data = [
    ['dig in', '开动；开始吃饭', '* 适用语境：在餐桌上表示可以开始用餐时使用。\n* 近义词辨析：dig in是口语化表达，help yourself指请自便，go ahead指请便。\n* 记忆技巧：dig(挖) + in(进入) = 挖进去吃 = 开动。\n* 常见搭配：let\'s dig in, feel free to dig in', 'A: The food looks amazing! Shall we dig in?\nB: Absolutely! I\'ve been looking forward to this all day.', 'A: 看起来好好吃！我们开动吧？\nB: 太好了！我盼这一天好久了。'],
    ['help yourself', '请自便；随便吃', '* 适用语境：主人招待客人时请客人随意取餐。\n* 近义词辨析：help yourself指请自便，make yourself at home指别客气，go ahead指请便。\n* 记忆技巧：help(帮助) + yourself(你自己) = 请你自己动手。\n* 常见搭配：help yourself to some, feel free to help yourself', 'A: Please help yourself to whatever you like.\nB: Thank you! The steak looks delicious.', 'A: 请随便吃，喜欢什么吃什么。\nB: 谢谢！牛排看起来很好吃。'],
    ['pass me', '递给我', '* 适用语境：在餐桌上请求别人递食物或调味品。\n* 近义词辨析：pass me指递给我，hand me指递给我（更正式），could I have指请给我。\n* 记忆技巧：pass(传递) + me(我) = 递给我。\n* 常见搭配：pass me the salt, pass me that dish', 'A: Could you pass me the salt?\nB: Sure, here you go.', 'A: 能把盐递给我吗？\nB: 好的，给你。'],
    ['bottom\'s up', '干杯', '* 适用语境：祝酒时表示一饮而尽。\n* 近义词辨析：bottom\'s up指干杯（喝完），cheers指碰杯（不一定喝完），to your health指祝你健康。\n* 记忆技巧：bottom(底部) + up(向上) = 杯底朝上 = 干杯。\n* 常见搭配：bottom\'s up everyone, say bottom\'s up', 'A: Bottom\'s up! To our friendship!\nB: Bottom\'s up! Cheers!', 'A: 干杯！为我们的友谊干杯！\nB: 干杯！'],
    ['cheers', '干杯；谢谢', '* 适用语境：碰杯时或表达感谢时使用。\n* 近义词辨析：cheers是英式常用干杯语，toast指祝酒，thanks指谢谢。\n* 记忆技巧：cheers本身是欢呼声，引申为干杯。\n* 常见搭配：cheers to that, three cheers', 'A: Cheers! Happy birthday!\nB: Thanks so much! This is my favorite restaurant.', 'A: 干杯！生日快乐！\nB: 非常感谢！这是我最喜欢的餐厅。'],
    ['bon appetit', '祝你好胃口', '* 适用语境：餐前祝别人用餐愉快。\n* 近义词辨析：bon appetit是法语借词，enjoy your meal是英语对应表达，happy eating是口语说法。\n* 记忆技巧：bon(好) + appetit(胃口) = 好胃口。\n* 常见搭配：say bon appetit, bon appetit everyone', 'A: Here\'s your steak. Bon appetit!\nB: Thank you! It smells amazing.', 'A: 你的牛排来了。祝你好胃口！\nB: 谢谢！闻起来太香了。'],
    ['mouthwatering', '令人垂涎的', '* 适用语境：描述食物看起来非常美味。\n* 近义词辨析：mouthwatering指令人流口水，appetizing指开胃的，delicious指美味的。\n* 记忆技巧：mouth(嘴) + watering(流口水) = 让人流口水。\n* 常见搭配：mouthwatering dishes, absolutely mouthwatering', 'A: Look at this spread! It\'s absolutely mouthwatering.\nB: I know right? I picked all my favorites.', 'A: 看这一桌！真是令人垂涎欲滴。\nB: 就是啊！我全是挑的我最爱吃的。'],
    ['seconds', '第二份；再来一份', '* 适用语境：表示想再吃一份。\n* 近义词辨析：seconds指第二份，another portion指另一份，refill指再添（用于饮料）。\n* 记忆技巧：second(第二) + s复数 = 第二份。\n* 常见搭配：have seconds, can I have seconds', 'A: That was delicious! Can I have seconds?\nB: Of course! There\'s plenty more in the kitchen.', 'A: 太好吃了！我能再来一份吗？\nB: 当然可以！厨房里还有很多。'],
    ['leftovers', '剩菜；打包', '* 适用语境：餐后吃不完要打包时使用。\n* 记忆技巧：left(留下) + overs(剩余) = 剩下的东西。\n* 常见搭配：take leftovers, pack leftovers', 'A: Would you like to take home the leftovers?\nB: Yes, please. Don\'t want to waste this amazing food.', 'A: 你想打包剩菜吗？\nB: 是的，可不想浪费这么好吃的菜。'],
    ['full', '吃饱的', '* 适用语境：表示已经吃够了。\n* 近义词辨析：full指吃饱了，satisfied指满足的，stuffed指吃撑了。\n* 记忆技巧：full是满的意思，引申为吃饱。\n* 常见搭配：I\'m full, completely full', 'A: Would you like some dessert?\nB: I\'m really full, but maybe just a small piece.', 'A: 想吃点甜点吗？\nB: 我已经吃饱了，但可能还能吃一小块。'],
    ['eating out', '外出就餐', '* 适用语境：讨论去餐厅吃饭。\n* 近义词辨析：eating out指外出就餐，dining out指正式外出用餐，restaurant指餐厅。\n* 记忆技巧：eating(吃) + out(外面) = 在外面吃。\n* 常见搭配：love eating out, eating out tonight', 'A: How about eating out tonight?\nB: Great idea! There\'s a new Italian place I want to try.', 'A: 今晚出去吃怎么样？\nB: 好主意！我想试试一家新开的意大利餐厅。'],
    ['make a reservation', '预订座位', '* 适用语境：提前预约餐厅位置。\n* 近义词辨析：make a reservation是正式预订，book a table是口语说法，reserve是动词形式。\n* 记忆技巧：make(做) + reservation(预订) = 做预订。\n* 常见搭配：make a reservation for two, do I need to make a reservation', 'A: Should we make a reservation? It\'s Saturday night.\nB: Good idea. The place is usually packed.', 'A: 我们要预订吗？今晚是周六晚上。\nB: 好主意。这家店通常很满。'],
    ['wait to be seated', '等候入座', '* 适用语境：在餐厅门口等待服务员安排座位。\n* 近义词辨析：wait to be seated指等入座，queue for a table指排队等位，the waiting list指等位名单。\n* 记忆技巧：wait(等) + to be seated(被安排座位) = 等候入座。\n* 常见搭配：please wait to be seated, we\'ll wait to be seated', 'A: Do we just sit anywhere?\nB: No, we need to wait to be seated by the host.', 'A: 我们随便坐吗？\nB: 不，我们需要等服务员安排座位。'],
    ['the menu, please', '请给我菜单', '* 适用语境：在餐厅入座后要点餐。\n* 近义词辨析：the menu please是常用表达，can I see the menu是较礼貌说法，menu是名词。\n* 记忆技巧：the menu(菜单) + please(请) = 请给我菜单。\n* 常见搭配：excuse me, the menu please', 'A: Excuse me, the menu please?\nB: Of course, here you are. Take your time.', 'A: 打扰一下，请给我菜单？\nB: 好的，给你。慢慢看。'],
    ['I\'m ready to order', '我准备好点餐了', '* 适用语境：表示可以开始点菜。\n* 近义词辨析：I\'m ready to order是标准表达，can I order是礼貌说法，we\'re ready表示我们准备好了。\n* 记忆技巧：ready(准备好的) + order(点餐) = 准备好点餐。\n* 常见搭配：I\'m ready to order now, are you ready to order', 'A: Are you ready to order?\nB: Yes, I\'m ready to order. I\'ll have the pasta.', 'A: 你准备好点餐了吗？\nB: 是的，我准备好了。我要意面。'],
    ['what do you recommend', '你推荐什么', '* 适用语境：向服务员询问特色菜。\n* 近义词辨析：what do you recommend是常用表达，what\'s good是口语说法，any suggestions是征求意见。\n* 记忆技巧：what(什么) + do you recommend(你推荐) = 你推荐什么。\n* 常见搭配：what do you recommend here, can you recommend something', 'A: What do you recommend?\nB: Our chef\'s special is the grilled salmon. It\'s very popular.', 'A: 你推荐什么？\nB: 我们主厨的特色是烤三文鱼，非常受欢迎。'],
    ['special of the day', '今日特餐', '* 适用语境：餐厅当天的特别推荐。\n* 近义词辨析：special of the day指今日特餐，daily special指每日特惠，chef\'s special指主厨特选。\n* 记忆技巧：special(特别的) + of the day(当天) = 今日特餐。\n* 常见搭配：today\'s special, the special of the day', 'A: What\'s the special of the day?\nB: It\'s a steak with mushroom sauce. Would you like that?', 'A: 今日特餐是什么？\nB: 是牛排配蘑菇酱。您要这个吗？'],
    ['appetizer', '开胃菜；前菜', '* 适用语境：主菜之前的小菜。\n* 近义词辨析：appetizer指开胃菜，starter是英式说法，entree在美式指主菜。\n* 记忆技巧：appetite(胃口) + izer = 开胃的东西。\n* 常见搭配：order an appetizer, appetizer plate', 'A: Should we get some appetizers to share?\nB: Sure! How about the bruschetta?', 'A: 我们要不要点些开胃菜一起吃？\nB: 好啊！来点意式烤面包怎么样？'],
    ['main course', '主菜', '* 适用语境：正餐中的主要菜品。\n* 近义词辨析：main course指主菜，main dish是同义，entree在美式英语中指主菜。\n* 记忆技巧：main(主要的) + course(一道菜) = 主菜。\n* 常见搭配：for main course, choose a main course', 'A: Are you done with your appetizer? Your main course is coming up.\nB: Great, I\'m starving!', 'A: 你的开胃菜吃完了吗？主菜马上上来。\nB: 太好了，我饿死了！'],
    ['dessert', '甜点', '* 适用语境：餐后的甜食。\n* 近义词辨析：dessert指甜点，sweet是甜食统称，afters是英式口语说法。\n* 记忆技巧：dessert结尾有两个s，像两个勺子 = 甜点。\n* 常见搭配：have dessert, dessert menu', 'A: Any room for dessert?\nB: Always! What do you have?', 'A: 还有肚子吃甜点吗？\nB: 永远有！你们有什么？'],
    ['the bill, please', '请结账', '* 适用语境：餐后请求买单。\n* 近义词辨析：the bill please是英式用法，the check please是美式用法，can we have the check是较礼貌说法。\n* 记忆技巧：bill(账单) + please(请) = 请结账。\n* 常见搭配：excuse me, the bill please', 'A: Excuse me, the bill please?\nB: Sure, I\'ll bring it right away.', 'A: 打扰一下，请结账？\nB: 好的，我马上拿来。'],
    ['treat', '请客', '* 适用语境：表示请对方吃饭。\n* 近义词辨析：treat指请客，my treat是我的东道，it\'s on me是算我的。\n* 记忆技巧：treat原意是对待，引申为款待。\n* 常见搭配：it\'s my treat, let me treat you', 'A: This dinner is amazing. Thank you!\nB: My treat! Happy to bring you here.', 'A: 这顿饭太棒了！谢谢！\nB: 我请客！很高兴能带你来。'],
    ['split the bill', 'AA制；分账', '* 适用语境：共同用餐后分摊费用。\n* 近义词辨析：split the bill是分摊，go Dutch是AA制，separate checks是各付各的。\n* 记忆技巧：split(分开) + bill(账单) = 分开账单。\n* 常见搭配：let\'s split the bill, shall we split the bill', 'A: Let\'s split the bill this time.\nB: Sure, that works for me.', 'A: 这次我们AA制吧。\nB: 好的，我没意见。'],
    ['go Dutch', 'AA制', '* 适用语境：各付各的。\n* 近义词辨析：go Dutch是AA制，split the bill是分账，separate checks是分别买单。\n* 记忆技巧：Dutch(荷兰人) = 荷兰人付自己的。\n* 常见搭配：let\'s go Dutch, want to go Dutch', 'A: This is a bit expensive. Should we go Dutch?\nB: That\'s fine with me.', 'A: 这个有点贵。我们AA制吧？\nB: 我没问题。'],
    ['tip', '小费', '* 适用语境：给服务员额外费用。\n* 近义词辨析：tip指小费，gratuity是正式说法，service charge是服务费。\n* 记忆技巧：tip原指尖端，给小费是给点额外的东西。\n* 常见搭配：leave a tip, how much to tip', 'A: How much should we tip?\nB: Usually around 15-20% of the bill.', 'A: 我们应该给多少小费？\nB: 通常是账单的15-20%。'],
    ['refill', '续杯', '* 适用语境：饮料喝完后请求再添。\n* 近义词辨析：refill指续杯，top up是英式说法，more是口语表达。\n* 记忆技巧：re-再 + fill(装满) = 再装满。\n* 常见搭配：can I get a refill, refill please', 'A: Can I get a refill on my coffee?\nB: Of course! Would you like a fresh cup?', 'A: 我的咖啡能续杯吗？\nB: 当然！你要现冲一杯吗？'],
    ['takeout', '外卖；打包', '* 适用语境：食物带走吃。\n* 近义词辨析：takeout是美式说法，takeaway是英式说法，to带走 go是要。\n* 记忆技巧：take(拿) + out(出去) = 拿出去吃。\n* 常见搭配：get takeout, order takeout', 'A: I don\'t feel like cooking tonight. Let\'s get takeout.\nB: Good idea! What are you in the mood for?', 'A: 今晚不想做饭了。我们点外卖吧。\nB: 好主意！你想吃什么？'],
    ['spicy', '辣的', '* 适用语境：描述食物的味道。\n* 近义词辨析：spicy指辣的，hot也可指辣，mild指不辣的。\n* 记忆技巧：spice(香料) + y形容词后缀 = 辣的。\n* 常见搭配：too spicy, how spicy', 'A: Is this dish spicy?\nB: Yes, it\'s quite spicy. Would you like it milder?', 'A: 这道菜辣吗？\nB: 是的，很辣。你想要不辣一点的吗？'],
    ['allergen', '过敏原', '* 适用语境：说明食物过敏。\n* 近义词辨析：allergen指过敏原，allergy指过敏症，intolerance指不耐受。\n* 记忆技巧：allerg(过敏) + en名词后缀 = 过敏原。\n* 常见搭配：food allergen, have an allergen', 'A: Do you have any food allergies or allergens?\nB: Yes, I\'m allergic to shellfish.', 'A: 你有什么食物过敏吗？\nB: 是的，我对贝类过敏。'],
    ['nut-free', '不含坚果', '* 适用语境：要求食物不含坚果。\n* 近义词辨析：nut-free指不含坚果，peanut-free指不含花生，dairy-free指不含乳制品。\n* 记忆技巧：nut(坚果) + free(无) = 无坚果。\n* 常见搭配：is this nut-free, nut-free option', 'A: Is this dish nut-free? My daughter has a nut allergy.\nB: Let me check with the kitchen. I\'ll get back to you.', 'A: 这道菜不含坚果吧？我女儿对坚果过敏。\nB: 我去厨房确认一下，马上回复您。']
]

# 写入数据到工作表
for row_idx, row_data in enumerate(vocab_data, start=1):
    for col_idx, value in enumerate(row_data, start=1):
        ws.cell(row=row_idx, column=col_idx, value=value)

# 保存文件
output_path = r'E:\jingpengliu_work\Book\English\self-bulid-book2\口语词汇-全场景\五、餐饮类\5.2 用餐对话.xlsx'
wb.save(output_path)
print(f'文件已保存到: {output_path}')
