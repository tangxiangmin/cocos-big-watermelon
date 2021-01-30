// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        id: 0,
    },
    init(data) {
        this.id = data.id
        const sp = this.node.getComponent(cc.Sprite)
        sp.spriteFrame = data.iconSF
    },
    start() {

    },
    onBeginContact(contact, self, other) {
        // todo 貌似检测比较消耗性能
        if (self.node && other.node) {
            const s = self.node.getComponent('Fruit')
            const o = other.node.getComponent('Fruit')
            if (s && o && s.id === o.id) {
                self.node.emit('beginContact', {self, other});
            }
        }
    },
});
