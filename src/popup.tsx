import { useEffect, useState } from "react"
import type { Account } from "@/src/types/account";
import { Button, Input, List, Card, message, Popconfirm, Modal, Tooltip, Tag } from "antd"
import { UserOutlined, LockOutlined, SwapOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Select } from "antd"
import styles from '@/src/styles/popup.module.less'
const { TextArea } = Input

function IndexPopup() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [newAccount, setNewAccount] = useState<Account>({
    username: "",
    password: "",
    remark: "",
    environment: "prod"
  })
  const [loading, setLoading] = useState(true)
  const [messageApi, contextHolder] = message.useMessage()
  const [editingAccount, setEditingAccount] = useState<{ index: number, account: Account } | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list')

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
      setNewAccount({ username: "", password: "", remark: "", environment: "prod" })
      setActiveTab('list')
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
          url: "/v3/auth/",
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

  const handleEditAccount = async () => {
    if (!editingAccount) return
    if (!editingAccount.account.username || !editingAccount.account.password) {
      messageApi.warning("请输入用户名和密码")
      return
    }

    try {
      const updatedAccounts = [...accounts]
      updatedAccounts[editingAccount.index] = editingAccount.account
      await chrome.storage.local.set({ accounts: updatedAccounts })
      setAccounts(updatedAccounts)
      setEditingAccount(null)
      messageApi.success("修改账号成功")
    } catch (error) {
      messageApi.error("修改账号失败")
      console.error(error)
    }
  }

  return (
    <div className={`${styles.container} ${!!editingAccount ? styles.containerExpanded : ''}`}>
      {contextHolder}
      <Card
        title="账号切换器"
        size="small"
        className={styles.card}
        loading={loading}
        extra={
          <Tooltip title={activeTab === 'list' ? '添加账号' : '返回列表'}>
            <Button
              type="link"
              size="small"
              icon={activeTab === 'list' ? <PlusOutlined /> : <SwapOutlined />}
              onClick={() => setActiveTab(activeTab === 'list' ? 'add' : 'list')}
            />
          </Tooltip>
        }>
        {activeTab === 'list' ? (
          <List
            size="small"
            dataSource={accounts}
            locale={{ emptyText: "暂无保存的账号" }}
            renderItem={(account, index) => (
              <List.Item
                className={styles.listItem}
                actions={[
                  <Tooltip title="编辑" key="edit">
                    <Button
                      icon={<EditOutlined />}
                      size="small"
                      onClick={() => setEditingAccount({ index, account: { ...account } })}
                    />
                  </Tooltip>,
                  <Tooltip title="切换" key="switch">
                    <Button
                      type="primary"
                      icon={<SwapOutlined />}
                      size="small"
                      onClick={() => handleSwitchAccount(account)}
                    />
                  </Tooltip>,
                  <Popconfirm
                    key="delete"
                    title="确定要删除这个账号吗？"
                    onConfirm={() => handleDeleteAccount(index)}
                    okText="确定"
                    cancelText="取消">
                    <Tooltip title="删除">
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                      />
                    </Tooltip>
                  </Popconfirm>
                ]}>
                <Tag
                  color={
                    account.environment === 'prod' ? 'red' :
                      account.environment === 'fat' ? 'orange' : 'green'
                  }
                  className={styles.environmentTag}
                >
                  {(account.environment || '').toUpperCase()}
                </Tag>
                <List.Item.Meta
                  title={account.username}
                  description={account.remark || "点击切换按钮登录此账号"}
                />
              </List.Item>
            )}
          />
        ) : (
          <div>
            <Input
              placeholder="用户名"
              prefix={<UserOutlined />}
              value={newAccount.username}
              onChange={(e) =>
                setNewAccount({ ...newAccount, username: e.target.value })
              }
              className={styles.formItem}
            />
            <Input.Password
              placeholder="密码"
              prefix={<LockOutlined />}
              value={newAccount.password}
              onChange={(e) =>
                setNewAccount({ ...newAccount, password: e.target.value })
              }
              className={styles.formItem}
            />
            <Select
              className={styles.formItem}
              style={{ width: '100%' }}
              value={newAccount.environment}
              onChange={(value) => setNewAccount({ ...newAccount, environment: value })}
              options={[
                { label: '生产环境', value: 'prod' },
                { label: '测试环境', value: 'fat' },
                { label: '开发环境', value: 'dev' },
              ]}
            />
            <TextArea
              placeholder="备注信息"
              value={newAccount.remark}
              onChange={(e) =>
                setNewAccount({ ...newAccount, remark: e.target.value })
              }
              className={styles.formItem}
              rows={2}
            />
            <Button
              type="primary"
              block
              onClick={handleAddAccount}>
              添加账号
            </Button>
          </div>
        )}
      </Card>

      <Modal
        title="修改账号"
        open={!!editingAccount}
        onOk={handleEditAccount}
        onCancel={() => setEditingAccount(null)}
        okText="确定"
        cancelText="取消"
        width={400}
        centered
        className={styles.editModal}
      >
        <Input
          placeholder="用户名"
          prefix={<UserOutlined />}
          value={editingAccount?.account.username}
          onChange={(e) =>
            setEditingAccount(prev =>
              prev ? { ...prev, account: { ...prev.account, username: e.target.value } } : null
            )
          }
          className={styles.formItem}
        />
        <Input.Password
          placeholder="密码"
          prefix={<LockOutlined />}
          value={editingAccount?.account.password}
          onChange={(e) =>
            setEditingAccount(prev =>
              prev ? { ...prev, account: { ...prev.account, password: e.target.value } } : null
            )
          }
          className={styles.formItem}
        />
        <Select
          className={styles.formItem}
          style={{ width: '100%' }}
          value={editingAccount?.account.environment}
          onChange={(value) =>
            setEditingAccount(prev =>
              prev ? { ...prev, account: { ...prev.account, environment: value } } : null
            )
          }
          options={[
            { label: '生产环境', value: 'prod' },
            { label: '测试环境', value: 'fat' },
            { label: '开发环境', value: 'dev' },
          ]}
        />
        <TextArea
          placeholder="备注信息"
          value={editingAccount?.account.remark}
          onChange={(e) =>
            setEditingAccount(prev =>
              prev ? { ...prev, account: { ...prev.account, remark: e.target.value } } : null
            )
          }
          className={styles.formItem}
          rows={2}
        />
      </Modal>
    </div>
  )
}

export default IndexPopup
