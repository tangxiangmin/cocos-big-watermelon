// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html


const Fruit = cc.Class({
    name: 'FruitItem',
    properties: {
        id: 0,
        iconSF: cc.SpriteFrame
    }
});

const JuiceItem = cc.Class({
    name: 'JuiceItem',
    properties: {
        particle: cc.SpriteFrame,
        circle: cc.SpriteFrame,
        slash: cc.SpriteFrame,
    }
});

cc.Class({
    extends: cc.Component,

    properties: {
        fruits: {
            default: [],
            type: Fruit
        },
        juices: {
            default: [],
            type: JuiceItem
        },

        // 动态生成 找到批量处理预置元素的方案
        fruitPrefab: {
            default: null,
            type: cc.Prefab
        },

        juicePrefab: {
            default: null,
            type: cc.Prefab
        },

        juiceSprite1_1: {
            default: null,
            type: cc.SpriteFrame,
        },
        juiceSprite1_2: {
            default: null,
            type: cc.SpriteFrame,
        },
        juiceSprite1_3: {
            default: null,
            type: cc.SpriteFrame,
        },
        boomAudio: {
            default: null,
            type: cc.AudioClip
        },
        knockAudio: {
            default: null,
            type: cc.AudioClip
        },
        waterAudio: {
            default: null,
            type: cc.AudioClip
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        // 开启物理引擎
        this.initPhysics()

        // 开启碰撞检测
        this.initCollapse()

        this.isCreating = false
        // 监听点击事件 todo 是否能够注册全局事件
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this)

        this.initOneFruit()
    },

    start() {
        console.log('start')
    },

    initFruits() {
        for (let i = 0; i < this.items.length; ++i) {
            let item = cc.instantiate(this.fruitPrefab);
            let data = this.items[i];
            this.node.addChild(item);
            item.getComponent('ItemTemplate').init({
                id: data.id,
                itemName: data.itemName,
                itemPrice: data.itemPrice,
                iconSF: data.iconSF
            });
        }
    },

    initCollapse() {
        const manager = cc.director.getCollisionManager();
        manager.enabled = true
    },
    initPhysics() {
        const instance = cc.director.getPhysicsManager()
        instance.enabled = true
        // instance.debugDrawFlags = 4

        instance.gravity = cc.v2(0, -960);
        let width = this.node.width;
        let height = this.node.height;

        let node = new cc.Node();

        let body = node.addComponent(cc.RigidBody);
        body.type = cc.RigidBodyType.Static;

        const _addBound = (node, x, y, width, height) => {
            let collider = node.addComponent(cc.PhysicsBoxCollider);
            collider.offset.x = x;
            collider.offset.y = y;
            collider.size.width = width;
            collider.size.height = height;
        }

        _addBound(node, 0, -height / 2, width, 20);
        _addBound(node, 0, height / 2, width, 20);
        _addBound(node, -width / 2, 0, 20, height);
        _addBound(node, width / 2, 0, 20, height);

        node.parent = this.node;


        // add mouse joint
        let joint = node.addComponent(cc.MouseJoint);
        joint.mouseRegion = this.node;
    },

    initOneFruit(id = 1) {
        this.currentFruit = this.createFruit(0, 400, id)
    },

    onTouchStart(e) {
        if (this.isCreating) return
        this.isCreating = true

        const randomId = Math.floor(Math.random() * 5) + 1

        const fruit = this.currentFruit

        const pos = e.getLocation()
        let {x, y} = pos
        x = x - 320 + fruit.width / 2
        y = y - 480

        const action = cc.sequence(cc.moveBy(0.3, cc.v2(x, 0)).easing(cc.easeCubicActionIn()), cc.callFunc(() => {
            this.startFruitPhysics(fruit)

            // 1s后重新生成一个
            this.scheduleOnce(() => {
                this.initOneFruit(randomId)
                this.isCreating = false
            }, 1)
        }))

        fruit.runAction(action)
    },
    // 创建一个水果
    createOneFruit(num) {
        let fruit = cc.instantiate(this.fruitPrefab);
        const config = this.fruits[num - 1]

        fruit.getComponent('Fruit').init({
            id: config.id,
            iconSF: config.iconSF
        });

        // 有Fruit组件传入
        fruit.on('beginContact', ({self, other}) => {

            other.node.off('beginContact') // 两个node都会触发，todo 看看有没有其他方法只展示一次的

            self.node.removeFromParent(false)
            other.node.removeFromParent(false)

            const {x, y} = other.node
            const newFruit = this.createFruit(x, y, Math.min(num + 1, 11))

            this.startFruitPhysics(newFruit)
            // 展示动画
            newFruit.scale = 0
            newFruit.runAction(this.getScaleAction())

            this.createFruitJuice(num, cc.v2({x, y}), other.node.width)
        })

        fruit.getComponent(cc.RigidBody).type = cc.RigidBodyType.Static
        fruit.getComponent(cc.PhysicsCircleCollider).radius = 0

        this.node.addChild(fruit);

        return fruit
    },
    startFruitPhysics(fruit) {
        fruit.getComponent(cc.RigidBody).type = cc.RigidBodyType.Dynamic
        const physicsCircleCollider = fruit.getComponent(cc.PhysicsCircleCollider)
        physicsCircleCollider.radius = fruit.height / 2
        physicsCircleCollider.apply()
    },

    // 在指定位置生成水果
    createFruit(x, y, type = 1) {
        const fruit = this.createOneFruit(type)
        fruit.setPosition(cc.v2(x, y));
        return fruit
    },

    getScaleAction(node) {
        return cc.scaleTo(0.2, 1).easing(cc.easeCubicActionIn())
    },

    // 合并时的动画效果
    createFruitJuice(id, pos, n) {
        // 播放合并的声音
        cc.audioEngine.play(this.boomAudio, false, 1);
        cc.audioEngine.play(this.waterAudio, false, 1);

        // 展示动画

        let juice = cc.instantiate(this.juicePrefab);
        this.node.addChild(juice);

        const config = this.juices[id - 1]
        const instance = juice.getComponent('Juice')
        instance.init(config)
        instance.showJuice(pos, n)
    }


    // update (dt) {},
});
