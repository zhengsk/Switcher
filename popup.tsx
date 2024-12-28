import { useEffect, useState } from "react"
import type { Account } from "@/src/types"
import { Button, Input, List, Card, message, Popconfirm } from "antd"
import { UserOutlined, LockOutlined, SwapOutlined, DeleteOutlined } from "@ant-design/icons"

function IndexPopup() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [newAccount, setNewAccount] = useState({
    username: "",
    password: ""
  })
  const [loading, setLoading] = useState(true)
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true)
        const result = await chrome.storage.local.get("accounts")
        if (result.accounts) {
          setAccounts(result.accounts)
        }
      } catch (error) {
        messageApi.error("加载账号失败")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadAccounts()
  }, [])

  const handleAddAccount = async () => {
    if (!newAccount.username || !newAccount.password) {
      messageApi.warning("请输入用户名和密码")
      return
    }

    try {
      const updatedAccounts = [...accounts, newAccount]
      await chrome.storage.local.set({ accounts: updatedAccounts })
      setAccounts(updatedAccounts)
      setNewAccount({ username: "", password: "" })
      messageApi.success("添加账号成功")
    } catch (error) {
      messageApi.error("添加账号失败")
      console.error(error)
    }
  }

  const handleSwitchAccount = async (account: Account) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) {
        messageApi.error("未找到当前标签页")
        return
      }

      await chrome.tabs.sendMessage(tab.id, {
        type: "SWITCH_ACCOUNT",
        account,
        loginConfig: {
          url: "/api/login",
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        }
      })

      messageApi.success("正在切换账号...")
    } catch (error) {
      messageApi.error("切换账号失败")
      console.error(error)
    }
  }

  const handleDeleteAccount = async (index: number) => {
    try {
      const updatedAccounts = accounts.filter((_, i) => i !== index)
      await chrome.storage.local.set({ accounts: updatedAccounts })
      setAccounts(updatedAccounts)
      messageApi.success("删除成功")
    } catch (error) {
      messageApi.error("删除账号失败")
      console.error(error)
    }
  }

  return (
    <div style={{ width: 350, padding: "12px" }}>
      {contextHolder}
      <Card
        title="账号切换器"
        size="small"
        style={{ marginBottom: 16 }}
        loading={loading}>
        <List
          size="small"
          dataSource={accounts}
          locale={{ emptyText: "暂无保存的账号" }}
          renderItem={(account, index) => (
            <List.Item
              actions={[
                <Button
                  key="switch"
                  type="primary"
                  icon={<SwapOutlined />}
                  size="small"
                  onClick={() => handleSwitchAccount(account)}>
                  切换
                </Button>,
                <Popconfirm
                  key="delete"
                  title="确定要删除这个账号吗？"
                  onConfirm={() => handleDeleteAccount(index)}
                  okText="确定"
                  cancelText="取消">
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              ]}>
              <List.Item.Meta
                title={account.username}
                description="点击切换按钮登录此账号"
              />
            </List.Item>
          )}
        />
      </Card>

      <Card
        title="添加新账号"
        size="small">
        <Input
          placeholder="用户名"
          prefix={<UserOutlined />}
          value={newAccount.username}
          onChange={(e) =>
            setNewAccount({ ...newAccount, username: e.target.value })
          }
          style={{ marginBottom: 8 }}
        />
        <Input.Password
          placeholder="密码"
          prefix={<LockOutlined />}
          value={newAccount.password}
          onChange={(e) =>
            setNewAccount({ ...newAccount, password: e.target.value })
          }
          style={{ marginBottom: 8 }}
        />
        <Button
          type="primary"
          block
          onClick={handleAddAccount}>
          添加账号
        </Button>
      </Card>
    </div>
  )
}

export default IndexPopup
