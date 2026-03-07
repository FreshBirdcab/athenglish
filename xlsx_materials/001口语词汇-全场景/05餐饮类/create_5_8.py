import openpyxl
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font
import os

# 创建工作簿
wb = Workbook()
ws = wb.active

# 定义30个咖啡厅与饮品场景的口语词汇/短语数据
vocabulary_data = [
    # 1
    [
        "espresso",
        "意式浓缩咖啡",
        "适用语境：咖啡爱好者追求浓郁口感时的首选，或作为其他咖啡饮品的基础。近义词辨析：espresso vs. coffee - espresso是通过高压萃取的浓缩咖啡，味道更浓郁醇厚；coffee通常指普通滴滤咖啡，口感较淡。记忆技巧：espresso源自意大利语esprimere，意为快速挤压，精准描述了其制作方式。常见搭配：double espresso双份意式浓缩, espresso shot一份意式浓缩",
        "A: I'll have a double espresso, please.\nB: Sure, would you like it to go or to stay here?\nA: To stay. I'll sit at the counter.\nB: Coming right up!",
        "A: 请给我一杯双份意式浓缩。\nB: 好的，您要打包还是在这里喝？\nA: 在这里喝。我坐吧台这边。\nB: 马上就好！"
    ],
    # 2
    [
        "latte",
        "拿铁咖啡",
        "适用语境：喜欢奶味较重、口感顺滑的咖啡饮品时常用。近义词辨析：latte vs. cappuccino - 两者都含牛奶，但cappuccino奶泡更丰富，咖啡味更突出；latte牛奶比例更高，口感更柔和。记忆技巧：latte源自意大利语caffe latte，字面意思就是咖啡牛奶。常见搭配：oat latte燕麦拿铁, vanilla latte香草拿铁, iced latte冰拿铁",
        "A: What can I get you today?\nB: I'd like a large oat latte, please.\nA: Okay, any sweetener?\nB: Just a little honey, thanks.",
        "A: 今天想喝点什么？\nB: 请给我一杯大杯燕麦拿铁。\nB: 好的，要加甜味剂吗？\nB: 少加一点蜂蜜就好，谢谢。"
    ],
    # 3
    [
        "cappuccino",
        "卡布奇诺",
        "适用语境：早餐时段或想要一杯奶泡丰富的咖啡时首选。近义词辨析：cappuccino vs. latte - 两者最大区别在于奶泡厚度，cappuccino奶泡约占饮品一半，latte奶泡较薄。记忆技巧：cappuccino源于意大利语，因其颜色像天主教卡布奇修会修士的长袍而得名。常见搭配：dry cappuccino干卡布奇诺奶泡多, wet cappuccino湿卡布奇诺牛奶多",
        "A: Can I get a cappuccino with extra foam?\nB: Of course! Would you like it in a ceramic mug or a paper cup?\nA: A ceramic mug, please. I hate paper cups for hot drinks.\nB: No problem, that helps the flavor too!",
        "A: 请给我一杯奶泡多一点的卡布奇诺。\nB: 好的！您想要陶瓷杯还是纸杯？\nA: 陶瓷杯吧。我不喜欢用纸杯装热饮。\nB: 没问题，这样口感也确实更好！"
    ],
    # 4
    [
        "Americano",
        "美式咖啡",
        "适用语境：想要一杯黑咖啡但又觉得意式浓缩太浓时。近义词辨析：Americano vs. black coffee - Americano是用热水稀释意式浓缩，有咖啡油脂；black coffee通常指滴滤或手冲咖啡，口感更清淡。记忆技巧：Americano据说是二战时期美国大兵在意大利喝不惯浓咖啡而加水稀释而得名。常见搭配：iced Americano冰美式, Americano with room for cream加奶的美式留空间",
        "A: Hi, can I have an iced Americano?\nB: Sure, what size?\nA: Medium, please. And could you leave some room?\nB: Sure thing, I'll add room for cream.",
        "A: 嗨，请给我一杯冰美式。\nB: 好的，大杯还是中杯？\nA: 中杯吧。帮我留点空间。\nB: 好的，我帮您留出加奶油的空间。"
    ],
    # 5
    [
        "mocha",
        "摩卡咖啡",
        "适用语境：喜欢巧克力风味咖啡的甜食爱好者首选。近义词辨析：mocha vs. chocolate latte - mocha含有巧克力酱和咖啡，风味浓郁；chocolate latte可能只是加巧克力糖浆，没有巧克力酱那么浓郁。记忆技巧：mocha源自也门港口城市Mokha，该地以出口咖啡豆闻名。常见搭配：white mocha白摩卡用白巧克力酱, mocha frappe摩卡冰沙",
        "A: What's your most popular drink?\nB: Our mocha is a big hit, especially with the whipped cream on top.\nA: That sounds perfect. I'll try one.\nB: Great choice! It's rich and not too sweet.",
        "A: 你们最受欢迎的饮品是什么？\nB: 我们的摩卡咖啡很受欢迎，尤其是上面加鲜奶油的那款。\nA: 听起来很棒，我要一杯。\nB: 选得好！口感浓郁但不会太甜。"
    ],
    # 6
    [
        "macchiato",
        "玛奇朵",
        "适用语境：想要在浓缩咖啡中加一点牛奶又不想太清淡时。近义词辨析：macchiato vs. espresso - macchiato在浓缩咖啡中加了少量牛奶染色，espresso是纯浓缩。caramel macchiato是星巴克的特色，牛奶比例更高。记忆技巧：macchiato源自意大利语macchiato，意为染色的，形容牛奶给咖啡染上奶白色。常见搭配：caramel macchiato焦糖玛奇朵, espresso macchiato意式玛奇朵",
        "A: I'd like an espresso macchiato.\nB: Sure, that's our classic. Anything else?\nA: No, that's it. Thanks.\nB: Here you go. Enjoy!",
        "A: 请给我一杯意式玛奇朵。\nB: 好的，这是我们的经典款。还要别的吗？\nA: 不了，就这些，谢谢。\nB: 给您，请享用！"
    ],
    # 7
    [
        "iced coffee",
        "冰咖啡",
        "适用语境：夏季或喜欢冷饮时点单首选。近义词辨析：iced coffee vs. cold brew - iced coffee通常是快速冷却的咖啡，口感可能略带酸涩；cold brew是冷水慢速萃取，口感更顺滑甘甜。记忆技巧：直接记忆iced + coffee的组合即可。常见搭配：iced coffee with milk加奶冰咖啡, sweetened iced coffee加糖冰咖啡",
        "A: It's so hot today! I'll take an iced coffee.\nB: Would you like milk and sugar in that?\nA: Yes, please. Just a splash of milk and one sugar.\nB: Got it. One iced coffee coming up!",
        "A: 今天太热了！我要一杯冰咖啡。\nB: 要加奶和糖吗？\nA: 是的，少加一点奶，一块糖。\nB: 好的，一杯冰咖啡马上好！"
    ],
    # 8
    [
        "decaf",
        "低因咖啡",
        "适用语境：因咖啡因敏感或晚间不想失眠时点选。近义词辨析：decaf vs. regular - decaf咖啡因含量极低约5mg杯，regular约95mg杯。half-caff是半咖啡因，一半正常一半低因。记忆技巧：decaf是decaffeinated的缩写，记忆de-前缀表示去除即可。常见搭配：decaf latte低因拿铁, decaf espresso低因意式浓缩",
        "A: Can I get a decaf latte? I'm trying to cut down on caffeine.\nB: Sure, no problem. Would you like that iced or hot?\nA: Hot, please. It's chilly outside.\nB: Absolutely. One decaf latte coming right up.",
        "A: 请给我一杯低因拿铁，我在减少咖啡因摄入。\nB: 好的，您要冰的还是热的？\nA: 热的吧，外面挺冷的。\nB: 没问题，一杯低因拿铁马上好！"
    ],
    # 9
    [
        "extra shot",
        "加一份浓缩",
        "适用语境：需要更多咖啡因或想要更浓郁咖啡味时添加。近义词辨析：extra shot vs. double - 两者都表示多加一份浓缩咖啡，double更口语化，extra shot在点单时更正式。记忆技巧：shot本意注射，在咖啡中指一份意式浓缩的量。常见搭配：extra shot of espresso多加一份意式浓缩, triple shot三份浓缩",
        "A: Can I get an extra shot in my latte?\nB: Sure, no problem. That'll be a bit stronger.\nA: Perfect, I need the extra caffeine today.\nB: I hear you. Long day ahead?",
        "A: 请在我的拿铁里多加一份浓缩。\nB: 好的，没问题。会更有劲。\nA: 太好了，我今天特别需要多加点咖啡因。\nB: 理解。今天任务很重吗？"
    ],
    # 10
    [
        "oat milk",
        "燕麦奶",
        "适用语境：乳糖不耐受或追求植物基饮品时首选。近义词辨析：oat milk vs. almond milk vs. soy milk - 燕麦奶口感最接近全脂牛奶，杏仁奶带坚果香但口感较稀，豆浆是最传统的植物奶选择。记忆技巧：oat燕麦 + milk奶组合记忆。常见搭配：oat latte燕麦拿铁, oat milk tea燕麦奶茶",
        "A: What milk options do you have?\nB: We have whole milk, skim, almond, oat, and soy.\nA: I'll go with oat milk, please. Is it creamy?\nB: Oh yes, it's very popular. Almost like regular milk!",
        "A: 你们有什么奶类选择？\nB: 有全脂牛奶、脱脂牛奶、杏仁奶、燕麦奶和豆浆。\nA: 请给我燕麦奶。口感浓郁吗？\nB: 是的，非常受欢迎。几乎和普通牛奶一样！"
    ],
    # 11
    [
        "whipped cream",
        "鲜奶油",
        "适用语境：点摩卡、热巧克力或想要增加风味和口感时添加。近义词辨析：whipped cream vs. cream - whipped cream是打发的鲜奶油，轻盈绵密；cream通常指液体奶油。记忆技巧：whipped源自whip搅拌，通过搅拌空气使奶油打发。常见搭配：whipped cream on top上面加鲜奶油, extra whipped cream多加鲜奶油",
        "A: Can I get a mocha with extra whipped cream?\nB: Sure, how extra? Just a lot or as much as possible?\nA: As much as possible, please. I'm treating myself today.\nB: Ha! You got it. That's a lot of whipped cream!",
        "A: 请给我的摩卡多加鲜奶油。\nB: 好的，您想加多少？多一点还是能加多少加多少？\nA: 能加多少加多少吧，今天我要好好犒劳自己。\nB: 哈哈！好的，那可得加好多鲜奶油！"
    ],
    # 12
    [
        "caramel drizzle",
        "焦糖酱",
        "适用语境：喜欢甜味和焦糖风味时添加到咖啡或饮品上。近义词辨析：caramel drizzle vs. caramel syrup - drizzle是浓稠的酱，syrup是较稀的糖浆。drizzle通常淋在饮品表面，syrup加在饮品内部。记忆技巧：drizzle意为细雨般落下，形容酱料淋在饮品上的样子。常见搭配：caramel drizzle on latte拿铁上淋焦糖酱, extra caramel drizzle多加焦糖酱",
        "A: I'd like a vanilla latte with caramel drizzle, please.\nB: Sure, would you like that on top or stirred in?\nA: On top, please. I want to see it.\nB: Coming right up! It looks beautiful.",
        "A: 请给我一杯香草拿铁，加焦糖酱。\nB: 好的，您想加在上面还是搅拌进去？\nA: 加在上面吧，我想看看。\nB: 马上好！看起来会很漂亮。"
    ],
    # 13
    [
        "single origin",
        "单一产地咖啡",
        "适用语境：咖啡爱好者追求特定产地风味时点选。近义词辨析：single origin vs. blend - single origin来自单一产地，风味独特；blend是混合豆，口感平衡稳定。记忆技巧：single单一 + origin产地组合记忆。常见搭配：single origin Ethiopia埃塞俄比亚单品咖啡, single origin Colombian哥伦比亚单品咖啡",
        "A: What kind of coffee do you have?\nB: We have a single origin from Ethiopia. It's fruity with notes of blueberry.\nA: That sounds interesting. I'll try that.\nB: Great choice! It's one of our best sellers.",
        "A: 你们有什么咖啡？\nB: 我们有一款埃塞俄比亚单品咖啡，带有水果风味和蓝莓的香气。\nA: 听起来很有意思，我要试试。\nB: 选得好！这是我们的热销款。"
    ],
    # 14
    [
        "cold brew",
        "冷萃咖啡",
        "适用语境：追求顺滑、低酸度的冷咖啡饮品时首选。近义词辨析：cold brew vs. iced coffee - cold brew用冷水萃取12-24小时，口感顺滑甘甜；iced coffee是热咖啡加冰，口感可能偏酸。记忆技巧：cold冷 + brew冲泡组合，记住是冷水长时间冲泡的咖啡。常见搭配：cold brew with milk加奶冷萃, nitro cold brew氮气冷萃",
        "A: What's the difference between the cold brew and the iced coffee?\nB: Cold brew is steeped in cold water for hours, so it's smoother and less acidic.\nA: I'll take the cold brew then. I have a sensitive stomach.\nB: Smart choice. You'll love it!",
        "A: 冷萃咖啡和冰咖啡有什么区别？\nB: 冷萃咖啡是用冷水浸泡好几个小时制作的，所以口感更顺滑，酸度更低。\nA: 那我要冷萃吧。我胃比较敏感。\nB: 明智的选择。您一定会喜欢的！"
    ],
    # 15
    [
        "matcha latte",
        "抹茶拿铁",
        "适用语境：想要不含咖啡因的茶类饮品或喜欢抹茶风味时。近义词辨析：matcha latte vs. green tea - matcha latte是抹茶加牛奶的饮品，口感顺滑；green tea是纯绿茶，口感较淡。记忆技巧：matcha来自日语抹茶，latte仍是牛奶的意思。常见搭配：iced matcha latte冰抹茶拿铁, matcha latte with oat milk燕麦奶抹茶拿铁",
        "A: Do you have any non-coffee drinks?\nB: Yes, we have matcha latte, chai latte, and various teas.\nA: I'll go with an iced matcha latte, please.\nB: Sure, would you like it sweetened? We use honey.",
        "A: 你们有非咖啡类的饮品吗？\nB: 有的，我们有抹茶拿铁、香 chai latte和各种茶。\nA: 请给我一杯冰抹茶拿铁。\nB: 好的，您要加甜吗？我们用蜂蜜。"
    ],
    # 16
    [
        "chai latte",
        "印度拿铁",
        "适用语境：想要独特香料风味饮品或咖啡因摄入受限时。近义词辨析：chai latte vs. tea latte - chai是印度传统香料茶，风味独特；tea latte通常指港式奶茶或英式奶茶。记忆技巧：chai源自印地语茶，chai latte直译就是印度茶拿铁。常见搭配：iced chai latte冰chai latte, chai latte with almond milk杏仁奶奶茶拿铁",
        "A: What does a chai latte taste like?\nB: It's a blend of black tea with spices like cinnamon, cardamom, and ginger. It's warm and slightly sweet.\nA: That sounds cozy. I'll try one hot, please.\nB: Perfect for this weather!",
        "A: chai latte是什么味道？\nB: 是红茶和肉桂、豆蔻、生姜等香料的混合。口感温热，稍带甜味。\nA: 听起来很温暖。请给我一杯热的。\nB: 很适合这个天气！"
    ],
    # 17
    [
        "smoothie",
        "果昔",
        "适用语境：想要健康饮品或水果爱好者首选。近义词辨析：smoothie vs. milkshake - smoothie通常用水果和酸奶牛奶，健康低脂；milkshake含冰淇淋，热量较高。记忆技巧：smoothie源自smooth，意为顺滑的，形容口感。常见搭配：berry smoothie浆果果昔, banana smoothie香蕉果昔, green smoothie绿色果昔",
        "A: Can I get a smoothie?\nB: Sure, what kind? We have berry, banana, and green.\nA: What's in the green one?\nB: Spinach, kale, apple, and banana. It's very popular!",
        "A: 请给我一杯果昔。\nB: 好的，您要什么口味的？我们有浆果、香蕉和绿色的。\nA: 绿色的里面有什么？\nB: 菠菜、羽衣甘蓝、苹果和香蕉。非常受欢迎！"
    ],
    # 18
    [
        "herbal tea",
        "花草茶",
        "适用语境：想要无咖啡因饮品或放松舒缓时首选。近义词辨析：herbal tea vs. regular tea - herbal tea不含茶叶成分，不含咖啡因；regular tea红茶绿茶来自茶树，含咖啡因。记忆技巧：herbal意为草本的，花草茶是用花草植物泡的饮品。常见搭配：chamomile tea洋甘菊茶, peppermint tea薄荷茶, lavender tea薰衣草茶",
        "A: What do you have that's caffeine-free?\nB: We have a variety of herbal teas. Chamomile, peppermint, and rooibos are popular.\nA: I'll take a chamomile, please. I'm trying to relax.\nB: Great choice. Chamomile is very calming.",
        "A: 你们有什么不含咖啡因的饮品吗？\nB: 我们有很多花草茶。洋甘菊、薄荷和路易波西茶都很受欢迎。\nA: 请给我洋甘菊茶吧，我想放松一下。\nB: 选得好。洋甘菊非常舒缓身心。"
    ],
    # 19
    [
        "refill",
        "续杯",
        "适用语境：在咖啡厅想要免费续杯或询问续杯政策时。近义词辨析：refill vs. another cup - refill特指同一杯饮品再添加，通常免费；another cup是要再点一杯。记忆技巧：re-前缀表示再次，fill是装满，合起来就是再装满。常见搭配：free refill免费续杯, get a refill续杯",
        "A: Can I get a refill on this?\nB: Of course, it's free. Let me grab a new cup for you.\nA: Thanks! You're so kind.\nB: No problem. Need anything else?",
        "A: 请问我能续杯吗？\nB: 当然可以，免费续杯。给您换个新杯。\nA: 谢谢！你太好了。\nB: 不客气。还需要别的吗？"
    ],
    # 20
    [
        "to-go cup",
        "外带杯",
        "适用语境：点单时表明需要打包带走而非堂食。近义词辨析：to-go vs. for here - to-go是外带，for here是堂食。常见搭配：to-go cup外带杯, to-go bag外带袋",
        "A: Would you like that for here or to go?\nB: To go, please. I'm running late for a meeting.\nA: No problem. Here's your to-go cup.\nB: Thanks! Have a great day!",
        "A: 您在这里喝还是打包？\nB: 打包，我开会要迟到了。\nB: 没问题。给您外带杯。\nA: 谢谢！祝您一天顺利！"
    ],
    # 21
    [
        "room for cream",
        "留空间加奶油",
        "适用语境：点黑咖啡时想要自己添加奶油或希望少放咖啡多放奶时。近义词辨析：room for cream vs. light coffee - room for cream是留空间自己加，light coffee是让咖啡师少放咖啡。记忆技巧：room意为空间，room for cream就是留出加奶油的空间。常见搭配：leave room for cream留空间加奶油, with room留空间",
        "A: Can I get an Americano with room for cream?\nB: Sure, I'll leave about an inch at the top.\nA: Perfect, thanks.\nB: Here you go. Enjoy!",
        "A: 请给我一杯美式，留空间加奶油。\nB: 好的，我给您留大约一英寸的空间。\nA: 完美，谢谢。\nB: 给您，请享用！"
    ],
    # 22
    [
        "half-and-half",
        "半奶油半牛奶",
        "适用语境：想要咖啡口感更丰富但不要太腻时。近义词辨析：half-and-half vs. whole milk - half-and-half是半奶油半牛奶，脂肪含量约12%；whole milk全脂牛奶，脂肪含量约3.5%。记忆技巧：half一半 + and + half一半组合，理解为一比一混合即可。常见搭配：add half-and-half加半奶油半牛奶, coffee with half-and-half加半奶油半牛奶的咖啡",
        "A: Do you have any cream for my coffee?\nB: We have half-and-half, whole milk, and non-dairy options.\nA: Just a little half-and-half, please.\nB: Sure, there you go.",
        "A: 有奶油可以加到咖啡里吗？\nB: 我们有半奶油半牛奶、全脂牛奶和植物奶。\nA: 请给我加一点半奶油半牛奶就好。\nB: 好的，给您。"
    ],
    # 23
    [
        "vanilla syrup",
        "香草糖浆",
        "适用语境：想要给咖啡添加甜味和香草风味时。近义词辨析：vanilla syrup vs. vanilla extract - syrup是糖浆，可直接加饮品；extract是提取物，味浓需少量使用。记忆技巧：vanilla香草 + syrup糖浆组合记忆。常见搭配：vanilla latte香草拿铁, two pumps of vanilla syrup两泵香草糖浆",
        "A: What syrups do you have?\nB: We have vanilla, caramel, hazelnut, and lavender.\nA: Can I get a latte with vanilla syrup?\nB: Sure, how many pumps would you like?",
        "A: 你们有什么口味的糖浆？\nB: 我们有香草、焦糖、榛子和薰衣草。\nA: 请给我一杯加香草糖浆的拿铁。\nB: 好的，您要加几泵？"
    ],
    # 24
    [
        "loyalty card",
        "会员积分卡",
        "适用语境：常去某家咖啡厅，想要积累积分换免费饮品时。近义词辨析：loyalty card vs. membership card - loyalty card侧重于积分奖励制度，membership card泛指会员卡。记忆技巧：loyalty忠诚 + card卡，即忠诚顾客卡。常见搭配：stamp on loyalty card积分卡盖章, free drink on loyalty card积分卡换免费饮品",
        "A: Do you have a loyalty card?\nB: Yes, it's free to sign up. You get a free drink after every 10 purchases.\nA: Oh, that sounds great! Can you sign me up?\nB: Sure, what's your phone number?",
        "A: 你们有会员积分卡吗？\nB: 有的，注册免费。每消费10次送一杯免费饮品。\nA: 听起来很棒！请帮我注册一个。\nB: 好的，您的电话号码是多少？"
    ],
    # 25
    [
        "take a seat",
        "请坐",
        "适用语境：进入咖啡厅后询问座位或店员指引座位时。近义词辨析：take a seat vs. find a seat - take a seat更礼貌，暗示被邀请坐下；find a seat是自己找座位。记忆技巧：take拿、取 + seat座位，拿一个座位就是坐下。常见搭配：please take a seat请坐, take a seat anywhere随便坐",
        "A: Hi, can we take a seat anywhere?\nB: Yes, feel free to sit anywhere. I'll come to take your order.\nA: Thanks. We'll sit by the window.\nB: Great choice! It's nice and sunny there.",
        "A: 嗨，我们可以随便坐吗？\nB: 是的，随意坐。我会过来点单。\nA: 谢谢，我们坐窗边吧。\nB: 好选择！那边阳光很好。"
    ],
    # 26
    [
        "menu",
        "菜单",
        "适用语境：进入咖啡厅后想要看饮品选项或点单时。近义词辨析：menu vs. drink list - menu泛指所有食品饮品清单，drink list更侧重饮品。记忆技巧：发音类似免NU，想象免费看。常见搭配：look at the menu看菜单, what's on the menu菜单上有什么",
        "A: Can I see the menu, please?\nB: Sure, here you go. Take your time.\nA: Thanks. What's your recommendation?\nB: Our seasonal latte is very popular right now.",
        "A: 请给我看看菜单。\nB: 好的，给您。不着急。\nA: 谢谢。有什么推荐吗？\nB: 我们当季拿铁现在很受欢迎。"
    ],
    # 27
    [
        "paper receipt",
        "纸质收据",
        "适用语境：结账后想要收据或不需要收据时。近义词辨析：paper receipt vs. digital receipt - paper receipt是纸质，digital receipt是电子版。记忆技巧：receipt源自法语reçu，意为已收到，特指付款凭证。常见搭配：do you need a receipt需要收据吗, print the receipt打印收据",
        "A: Here's your total. Do you need a receipt?\nB: Yes, please. Can you email it to me?\nA: Sure, just give me your email.\nB: It's john@gmail.com. Thanks!",
        "A: 您一共消费这么多。需要收据吗？\nB: 是的，请给我。能发到我邮箱吗？\nA: 好的，请给我您的邮箱。\nB: john@gmail.com，谢谢！"
    ],
    # 28
    [
        "tip",
        "小费",
        "适用语境：结账时考虑是否给小费或询问小费政策时。近义词辨析：tip vs. service charge - tip是顾客自愿给的小费，service charge是餐厅自动收取的服务费。记忆技巧：tip作为小费是固定用法，可联想踢给服务生。常见搭配：leave a tip留小费, tip jar小费罐, tip 20%给20%小费",
        "A: Is the tip included?\nB: No, it's not. We appreciate tips but it's completely optional.\nA: Okay, I'll leave a small tip. Great service!\nB: Thank you so much! We appreciate it.",
        "A: 小费包含在内了吗？\nB: 没有，不包含。我们很感谢小费但完全是自愿的。\nA: 好的，我留一点小费。服务很好！\nB: 非常感谢！"
    ],
    # 29
    [
        "loyal customer",
        "回头客",
        "适用语境：店员与常客交流或常客表达支持时。近义词辨析：loyal customer vs. regular - regular更口语化，指常来的人；loyal customer强调忠诚度。记忆技巧：loyal忠诚的 + customer顾客组合记忆。常见搭配：thank our loyal customers感谢回头客, loyalty discount回头客优惠",
        "A: Welcome back! The usual today?\nB: Yes, please. You know me too well.\nA: Of course! It's nice to see a familiar face. Your latte is ready.\nB: Thanks! See you tomorrow.",
        "A: 欢迎回来！今天还是老样子？\nB: 是的，你太了解我了。\nA: 当然！看到熟面孔真好。您的拿铁好了。\nB: 谢谢！明天见。"
    ],
    # 30
    [
        "brew",
        "冲泡",
        "适用语境：询问咖啡是否新鲜冲泡或要求现煮时。近义词辨析：brew vs. instant - brew是现冲泡的，需要等待；instant是速溶的，即时可用。记忆技巧：brew就是冲泡的动作，常说freshly brewed现煮的。常见搭配：freshly brewed现煮的, brew a fresh pot煮一壶新的, how long to brew冲泡多久",
        "A: Is this coffee freshly brewed?\nB: Yes, it was brewed about 10 minutes ago.\nA: Perfect, I'll take a cup.\nB: Great choice. It's our signature blend.",
        "A: 这咖啡是现煮的吗？\nB: 是的，大约10分钟前煮的。\nA: 太好了，请给我一杯。\nB: 选得好。这是我们的招牌混合咖啡。"
    ]
]

# 写入数据到Excel（无标题行）
for row_idx, row_data in enumerate(vocabulary_data, start=1):
    for col_idx, cell_value in enumerate(row_data, start=1):
        cell = ws.cell(row=row_idx, column=col_idx)
        cell.value = cell_value
        # 设置单元格自动换行
        cell.alignment = Alignment(wrap_text=True, vertical='top')

# 调整列宽
ws.column_dimensions['A'].width = 25  # 单词/短语
ws.column_dimensions['B'].width = 18  # 中文翻译
ws.column_dimensions['C'].width = 60  # 深度解析
ws.column_dimensions['D'].width = 60  # 高分例句
ws.column_dimensions['E'].width = 50  # 例句翻译

# 调整行高以适应内容
for row in ws.iter_rows(min_row=1, max_row=30):
    ws.row_dimensions[row[0].row].height = 150

# 保存文件
output_path = r"E:\jingpengliu_work\Book\English\self-bulid-book2\口语词汇-全场景\五、餐饮类\5.8 咖啡厅与饮品.xlsx"
wb.save(output_path)
print(f"文件已成功保存到: {output_path}")
